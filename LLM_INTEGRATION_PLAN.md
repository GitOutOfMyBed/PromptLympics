# LLM Integration with LiteLLM

## Option 1: LiteLLM (Recommended) ✅

### Installation:
```bash
npm install litellm
```

### Updated Code:

```typescript
// lib/evaluation.ts
import { completion } from 'litellm'

async function callLLM(
  prompt: string,
  input: string,
  modelName: string  // ← Now exact model name like "gpt-4o-mini"
): Promise<string> {
  const fullPrompt = `${prompt}\n\nInput: ${input}\n\nOutput:`

  const response = await completion({
    model: modelName,  // ← Direct model name, no mapping needed
    messages: [{ role: "user", content: fullPrompt }],
    temperature: 0,
    max_tokens: 500,
  })

  return response.choices[0].message.content.trim()
}
```

### Model Dropdown:

```typescript
// competition-create-form.tsx
<SelectContent>
  {/* OpenAI Models */}
  <SelectItem value="gpt-4o">GPT-4o (Recommended)</SelectItem>
  <SelectItem value="gpt-4o-mini">GPT-4o Mini (Cheap)</SelectItem>
  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>

  {/* Anthropic Models */}
  <SelectItem value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Best)</SelectItem>
  <SelectItem value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Fast)</SelectItem>
  <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>

  {/* Google Models */}
  <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
  <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>

  {/* Open Source */}
  <SelectItem value="llama-3.1-70b">Llama 3.1 70B</SelectItem>
  <SelectItem value="mistral-large">Mistral Large</SelectItem>
</SelectContent>
```

### Complete Implementation:

```typescript
// lib/llm.ts
import { completion } from 'litellm'

export interface LLMCallOptions {
  model: string
  prompt: string
  temperature?: number
  maxTokens?: number
  apiKey?: string
}

export async function callLLM(options: LLMCallOptions): Promise<string> {
  const {
    model,
    prompt,
    temperature = 0,
    maxTokens = 500,
    apiKey
  } = options

  try {
    const response = await completion({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature,
      max_tokens: maxTokens,
      api_key: apiKey,  // Optional: use organizer's key
    })

    return response.choices[0].message.content.trim()
  } catch (error) {
    console.error(`LLM call failed for model ${model}:`, error)
    throw new Error(`LLM API error: ${error.message}`)
  }
}

// Helper to get cost estimate
export function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  // LiteLLM has built-in cost calculation
  const costPerToken = getCostPerToken(model)
  return (inputTokens * costPerToken.input + outputTokens * costPerToken.output)
}

// Cost database (from LiteLLM)
const COSTS = {
  "gpt-4o": { input: 0.0025 / 1000, output: 0.01 / 1000 },
  "gpt-4o-mini": { input: 0.00015 / 1000, output: 0.0006 / 1000 },
  "claude-3-5-sonnet-20241022": { input: 0.003 / 1000, output: 0.015 / 1000 },
  "claude-3-5-haiku-20241022": { input: 0.001 / 1000, output: 0.005 / 1000 },
  // ... etc
}
```

### Updated Evaluation Function:

```typescript
// lib/evaluation.ts
import { callLLM } from './llm'

async function evaluateTestCases(
  prompt: string,
  testCases: TestCase[],
  modelName: string,  // ← Exact model like "gpt-4o-mini"
  apiKey?: string     // ← Optional organizer's key
): Promise<{ correct: number; total: number; details: any[] }> {
  let correct = 0
  const details: any[] = []

  for (const testCase of testCases) {
    try {
      const fullPrompt = `${prompt}\n\nInput: ${testCase.input}\n\nOutput:`

      const output = await callLLM({
        model: modelName,
        prompt: fullPrompt,
        temperature: 0,
        maxTokens: 500,
        apiKey,
      })

      const isCorrect = compareOutputs(output, testCase.expectedOutput)

      if (isCorrect) correct++

      details.push({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: output,
        correct: isCorrect,
      })
    } catch (error) {
      details.push({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: null,
        correct: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  return { correct, total: testCases.length, details }
}
```

---

## Option 2: Vercel AI SDK (Alternative)

Another good option is Vercel's AI SDK:

```bash
npm install ai
```

```typescript
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'

async function callLLM(model: string, prompt: string) {
  const { text } = await generateText({
    model: getModel(model),
    prompt,
    temperature: 0,
    maxTokens: 500,
  })

  return text
}

function getModel(modelName: string) {
  if (modelName.startsWith('gpt')) {
    return openai(modelName)
  } else if (modelName.startsWith('claude')) {
    return anthropic(modelName)
  } else if (modelName.startsWith('gemini')) {
    return google(modelName)
  }
  throw new Error(`Unsupported model: ${modelName}`)
}
```

---

## Recommended Model List (December 2024)

### Best Overall:
- `claude-3-5-sonnet-20241022` - Best quality/price ratio
- `gpt-4o` - Excellent, slightly cheaper than Claude

### Best Budget:
- `gpt-4o-mini` - Very cheap, good quality
- `claude-3-5-haiku-20241022` - Fast, cheap, decent

### Best Quality (Expensive):
- `gpt-4-turbo` - OpenAI's best
- `claude-3-opus-20240229` - Anthropic's largest (but 3.5 Sonnet is better)

### Open Source:
- `llama-3.1-70b` - Meta's best open model
- `mistral-large` - Good European alternative

---

## Database Schema Update

```prisma
// schema.prisma
model Competition {
  id          String   @id @default(cuid())
  modelName   String   // ← Change from modelType to modelName
  // Store exact model: "gpt-4o-mini", "claude-3-5-sonnet-20241022"

  // Optional: Store API provider separately for UI grouping
  provider    String?  // "openai", "anthropic", "google", etc.
}
```

---

## Migration Plan

### Step 1: Install LiteLLM
```bash
npm install litellm
```

### Step 2: Update form dropdown
Replace generic types with exact model names

### Step 3: Update evaluation logic
Replace `callOpenAI`/`callAnthropic` with single `callLLM` function

### Step 4: Database migration
```sql
-- Migrate existing data
UPDATE competitions
SET modelName = CASE modelType
  WHEN 'GPT_4' THEN 'gpt-4-turbo'
  WHEN 'GPT_3_5_TURBO' THEN 'gpt-3.5-turbo'
  WHEN 'CLAUDE_3_OPUS' THEN 'claude-3-opus-20240229'
  WHEN 'CLAUDE_3_SONNET' THEN 'claude-3-sonnet-20240229'
  WHEN 'CLAUDE_3_HAIKU' THEN 'claude-3-haiku-20240307'
END;

-- Drop old column
ALTER TABLE competitions DROP COLUMN modelType;
```

### Step 5: Test with each provider
- OpenAI models
- Anthropic models
- Google models (if needed)

---

## Cost Comparison (Per 1M Input Tokens)

| Model | Cost | Speed | Quality |
|-------|------|-------|---------|
| **gpt-4o-mini** | $0.15 | Fast | Good |
| **gpt-4o** | $2.50 | Fast | Excellent |
| **claude-3-5-haiku** | $1.00 | Very Fast | Good |
| **claude-3-5-sonnet** | $3.00 | Medium | Excellent |
| **gemini-1.5-flash** | $0.075 | Very Fast | Good |

For your use case (100 test cases, 50 submissions):
- **gpt-4o-mini**: ~$0.50
- **claude-3-5-sonnet**: ~$15

---

## My Recommendation

**Use LiteLLM with exact model names:**

1. ✅ Maximum flexibility
2. ✅ Easy to add new models
3. ✅ Unified interface
4. ✅ Built-in cost tracking
5. ✅ Production-ready

**Specific models to support:**
- `gpt-4o-mini` (default - cheap & good)
- `gpt-4o` (premium option)
- `claude-3-5-sonnet-20241022` (best quality)
- `claude-3-5-haiku-20241022` (fast & cheap)

Start with these 4, add more as needed.
