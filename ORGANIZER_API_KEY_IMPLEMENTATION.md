# How to Implement Organizer API Keys with Vercel AI SDK

## Overview
The Vercel AI SDK now supports custom API keys. Here's how to implement organizer-provided API keys for competitions.

## 1. Update Database Schema

Add an encrypted API key field to the Competition model:

```prisma
// prisma/schema.prisma
model Competition {
  // ... existing fields ...

  // API Key (encrypted)
  encryptedApiKey     String?
  apiKeyProvider      String?  // "openai", "anthropic", or "google"
}
```

## 2. Add Encryption Utilities

```typescript
// lib/encryption.ts
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_SECRET! // 32 bytes
const ALGORITHM = 'aes-256-gcm'

export async function encryptApiKey(apiKey: string): Promise<string> {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv)

  let encrypted = cipher.update(apiKey, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  return JSON.stringify({
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  })
}

export async function decryptApiKey(encryptedData: string): Promise<string> {
  const { encrypted, iv, authTag } = JSON.parse(encryptedData)

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(iv, 'hex')
  )

  decipher.setAuthTag(Buffer.from(authTag, 'hex'))

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
```

## 3. Update Competition Form

```typescript
// app/competitions/create/_components/competition-create-form.tsx

// Add to form data type
type CompetitionFormData = {
  // ... existing fields ...
  apiKey: string
  useOrganizerKey: boolean
}

// Add to the form UI (Step 2 - Model Configuration)
<div className="space-y-4">
  <div className="flex items-center space-x-2">
    <Checkbox
      id="useOrganizerKey"
      checked={formData.useOrganizerKey}
      onCheckedChange={(checked) => updateFormData("useOrganizerKey", checked)}
    />
    <Label htmlFor="useOrganizerKey" className="text-sm font-medium">
      Use my own API key for evaluations
    </Label>
  </div>

  {formData.useOrganizerKey && (
    <Alert>
      <AlertDescription>
        Your API key will be encrypted and used only for evaluating submissions to this competition.
      </AlertDescription>
    </Alert>
  )}

  {formData.useOrganizerKey && (
    <div className="space-y-2">
      <Label htmlFor="apiKey">
        {formData.modelType.startsWith('gpt') && 'OpenAI API Key'}
        {formData.modelType.startsWith('claude') && 'Anthropic API Key'}
        {formData.modelType.startsWith('gemini') && 'Google AI API Key'}
      </Label>
      <Input
        id="apiKey"
        type="password"
        placeholder={
          formData.modelType.startsWith('gpt') ? 'sk-...' :
          formData.modelType.startsWith('claude') ? 'sk-ant-...' :
          'AIza...'
        }
        value={formData.apiKey}
        onChange={(e) => updateFormData("apiKey", e.target.value)}
      />
      <p className="text-xs text-muted-foreground">
        {formData.modelType.startsWith('gpt') && (
          <>Get your key from <a href="https://platform.openai.com/api-keys" target="_blank" className="underline">OpenAI Dashboard</a></>
        )}
        {formData.modelType.startsWith('claude') && (
          <>Get your key from <a href="https://console.anthropic.com/settings/keys" target="_blank" className="underline">Anthropic Console</a></>
        )}
        {formData.modelType.startsWith('gemini') && (
          <>Get your key from <a href="https://makersuite.google.com/app/apikey" target="_blank" className="underline">Google AI Studio</a></>
        )}
      </p>
    </div>
  )}
</div>

// Add validation
const validateForm = (): string | null => {
  // ... existing validation ...

  if (formData.useOrganizerKey && !formData.apiKey) {
    return "API key is required when using your own key"
  }

  // Validate API key format
  if (formData.useOrganizerKey && formData.apiKey) {
    if (formData.modelType.startsWith('gpt') && !formData.apiKey.startsWith('sk-')) {
      return "Invalid OpenAI API key format"
    }
    if (formData.modelType.startsWith('claude') && !formData.apiKey.startsWith('sk-ant-')) {
      return "Invalid Anthropic API key format"
    }
  }

  return null
}
```

## 4. Update API Route to Store Encrypted Key

```typescript
// app/api/competitions/route.ts
import { encryptApiKey } from '@/lib/encryption'

export async function POST(req: Request) {
  // ... existing code ...

  const data = await req.json()

  // Encrypt API key if provided
  let encryptedApiKey = null
  let apiKeyProvider = null

  if (data.apiKey) {
    encryptedApiKey = await encryptApiKey(data.apiKey)

    // Determine provider based on model
    if (data.modelType.startsWith('gpt')) {
      apiKeyProvider = 'openai'
    } else if (data.modelType.startsWith('claude')) {
      apiKeyProvider = 'anthropic'
    } else if (data.modelType.startsWith('gemini')) {
      apiKeyProvider = 'google'
    }
  }

  const competition = await prisma.competition.create({
    data: {
      // ... existing fields ...
      encryptedApiKey,
      apiKeyProvider,
    }
  })

  // Don't return encrypted key to client
  const { encryptedApiKey: _, ...safeCompetition } = competition
  return NextResponse.json(safeCompetition, { status: 201 })
}
```

## 5. Update Evaluation Logic

```typescript
// lib/evaluation.ts
import { callLLM as callLLMWithVercelAI } from "@/lib/llm"
import { decryptApiKey } from "@/lib/encryption"

type Competition = {
  id: string
  modelType: string
  encryptedApiKey: string | null
  // ... other fields ...
}

async function callLLM(
  prompt: string,
  input: string,
  modelName: string,
  encryptedApiKey?: string | null
): Promise<string> {
  const fullPrompt = `${prompt}\n\nInput: ${input}\n\nOutput:`

  // Decrypt API key if provided
  let apiKey: string | undefined
  if (encryptedApiKey) {
    apiKey = await decryptApiKey(encryptedApiKey)
  }

  // Use the Vercel AI SDK with optional custom API key
  return callLLMWithVercelAI({
    model: modelName,
    prompt: fullPrompt,
    temperature: 0,
    maxTokens: 500,
    apiKey,  // Will use env var if undefined
  })
}

async function evaluateTestCases(
  prompt: string,
  testCases: TestCase[],
  modelType: string,
  encryptedApiKey?: string | null
): Promise<{ correct: number; total: number; details: any[] }> {
  // ... existing code ...

  for (const testCase of testCases) {
    try {
      const output = await callLLM(
        prompt,
        testCase.input,
        modelType,
        encryptedApiKey  // Pass encrypted key
      )
      // ... rest of evaluation ...
    }
  }
}

export async function evaluatePrompt(
  submissionId: string,
  competition: Competition,
  prompt: string
): Promise<void> {
  // ... existing code ...

  // Pass encrypted API key to evaluation
  const results = await evaluateTestCases(
    prompt,
    validationData,
    competition.modelType,
    competition.encryptedApiKey  // Pass the encrypted key
  )

  // ... rest of evaluation ...
}
```

## 6. Environment Variables

Add to `.env`:

```env
# Encryption key for API keys (generate with: openssl rand -hex 32)
API_KEY_ENCRYPTION_SECRET="your-32-byte-hex-key-here"

# Fallback API keys (optional, used when organizer doesn't provide key)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_GENERATIVE_AI_API_KEY="AIza..."
```

## How It Works

1. **Competition Creation:**
   - Organizer selects a model (e.g., `gpt-4o-mini`)
   - Optionally provides their API key
   - Key is encrypted and stored in database

2. **Submission Evaluation:**
   - System decrypts organizer's API key
   - Passes key to Vercel AI SDK: `openai('gpt-4o-mini', { apiKey })`
   - Falls back to platform keys if no organizer key provided

3. **Cost Management:**
   - When using organizer's key: They see charges in their API provider dashboard
   - When using platform key: Platform absorbs cost (or bills organizer separately)

## Security Best Practices

1. **Never log API keys** - Add them to error exclusion lists
2. **Rotate encryption keys** regularly
3. **Use environment variables** for encryption keys
4. **Validate API keys** before storing (optional test call)
5. **Rate limit** evaluations to prevent abuse
6. **Monitor usage** to detect anomalies

## Testing Custom API Keys

```typescript
// Test that custom key is being used
const result = await callLLM({
  model: 'gpt-4o-mini',
  prompt: 'Say "Hello"',
  apiKey: 'sk-custom-test-key'  // This will be passed to OpenAI
})
```

The Vercel AI SDK will use the provided `apiKey` instead of the environment variable when making the API call.