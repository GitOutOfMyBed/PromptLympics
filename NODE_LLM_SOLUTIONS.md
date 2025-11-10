# Node.js LLM Integration Solutions

## ❌ LiteLLM - Python Only!
LiteLLM is a Python package. Won't work in Node.js/Next.js.

---

## ✅ Option 1: Vercel AI SDK (Best for Next.js)

**Installation:**
```bash
npm install ai @ai-sdk/openai @ai-sdk/anthropic
```

**Usage:**
```typescript
// lib/llm.ts
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'

export async function callLLM(modelName: string, prompt: string) {
  let model;

  // Map model names to providers
  if (modelName.startsWith('gpt')) {
    model = openai(modelName)  // e.g., "gpt-4o-mini"
  } else if (modelName.startsWith('claude')) {
    model = anthropic(modelName)  // e.g., "claude-3-5-sonnet-20241022"
  } else {
    throw new Error(`Unsupported model: ${modelName}`)
  }

  const { text } = await generateText({
    model,
    prompt,
    temperature: 0,
    maxTokens: 500,
  })

  return text
}
```

**Pros:**
- ✅ Built for Next.js/Vercel
- ✅ TypeScript native
- ✅ Streaming support
- ✅ Clean API

**Cons:**
- ❌ Limited providers (OpenAI, Anthropic, Google, few others)
- ❌ No cost tracking built-in

---

## ✅ Option 2: LangChain.js (Most Flexible)

**Installation:**
```bash
npm install langchain @langchain/openai @langchain/anthropic
```

**Usage:**
```typescript
// lib/llm.ts
import { ChatOpenAI } from '@langchain/openai'
import { ChatAnthropic } from '@langchain/anthropic'

export async function callLLM(modelName: string, prompt: string, apiKey?: string) {
  let llm;

  if (modelName.startsWith('gpt')) {
    llm = new ChatOpenAI({
      modelName,  // "gpt-4o-mini"
      temperature: 0,
      maxTokens: 500,
      openAIApiKey: apiKey || process.env.OPENAI_API_KEY,
    })
  } else if (modelName.startsWith('claude')) {
    llm = new ChatAnthropic({
      modelName,  // "claude-3-5-sonnet-20241022"
      temperature: 0,
      maxTokens: 500,
      anthropicApiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    })
  }

  const response = await llm.invoke(prompt)
  return response.content.toString()
}
```

**Pros:**
- ✅ Most providers supported
- ✅ Lots of features (chains, agents, etc.)
- ✅ Active development

**Cons:**
- ❌ Heavier bundle size
- ❌ More complex than needed for simple calls

---

## ✅ Option 3: Direct API Calls (Simple & Lightweight)

**Just use the APIs directly with better organization:**

```typescript
// lib/llm.ts

interface LLMProvider {
  call(prompt: string, apiKey?: string): Promise<string>
  getCost(): { input: number, output: number }
}

class OpenAIProvider implements LLMProvider {
  constructor(private model: string) {}

  async call(prompt: string, apiKey?: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey || process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: 500,
      })
    })

    const data = await response.json()
    return data.choices[0].message.content.trim()
  }

  getCost() {
    const costs: Record<string, { input: number, output: number }> = {
      'gpt-4o': { input: 0.0025, output: 0.01 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    }
    return costs[this.model] || { input: 0, output: 0 }
  }
}

class AnthropicProvider implements LLMProvider {
  constructor(private model: string) {}

  async call(prompt: string, apiKey?: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey || process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
      })
    })

    const data = await response.json()
    return data.content[0].text.trim()
  }

  getCost() {
    const costs: Record<string, { input: number, output: number }> = {
      'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
      'claude-3-5-haiku-20241022': { input: 0.001, output: 0.005 },
      'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
    }
    return costs[this.model] || { input: 0, output: 0 }
  }
}

// Factory function
export async function callLLM(modelName: string, prompt: string, apiKey?: string): Promise<string> {
  let provider: LLMProvider

  if (modelName.startsWith('gpt') || modelName.startsWith('o1')) {
    provider = new OpenAIProvider(modelName)
  } else if (modelName.startsWith('claude')) {
    provider = new AnthropicProvider(modelName)
  } else {
    throw new Error(`Unsupported model: ${modelName}`)
  }

  return provider.call(prompt, apiKey)
}

// Cost estimation
export function estimateCost(modelName: string, inputTokens: number, outputTokens: number): number {
  let provider: LLMProvider

  if (modelName.startsWith('gpt')) {
    provider = new OpenAIProvider(modelName)
  } else if (modelName.startsWith('claude')) {
    provider = new AnthropicProvider(modelName)
  } else {
    return 0
  }

  const costs = provider.getCost()
  return (inputTokens * costs.input + outputTokens * costs.output) / 1000
}
```

**Pros:**
- ✅ Full control
- ✅ Lightweight
- ✅ Easy to debug
- ✅ No dependencies

**Cons:**
- ❌ Have to maintain API changes
- ❌ More boilerplate

---

## ✅ Option 4: OpenRouter (Unified API)

**Use OpenRouter.ai as a proxy to all models:**

```typescript
// lib/llm.ts
export async function callLLM(modelName: string, prompt: string): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://promptlympics.com',
      'X-Title': 'PromptLympics'
    },
    body: JSON.stringify({
      model: modelName,  // Any model: "openai/gpt-4o-mini", "anthropic/claude-3.5-sonnet"
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 500,
    })
  })

  const data = await response.json()
  return data.choices[0].message.content.trim()
}
```

**Available models:**
- `openai/gpt-4o`
- `openai/gpt-4o-mini`
- `anthropic/claude-3.5-sonnet`
- `google/gemini-pro-1.5`
- `meta-llama/llama-3.1-70b`
- 100+ more

**Pros:**
- ✅ One API for everything
- ✅ Simple integration
- ✅ Pay-as-you-go
- ✅ Automatic fallbacks

**Cons:**
- ❌ Small markup on pricing
- ❌ Another service dependency

---

## My Recommendation for Your Next.js App

### For Simplicity: **Vercel AI SDK**
```bash
npm install ai @ai-sdk/openai @ai-sdk/anthropic
```

Clean, TypeScript-native, built for Next.js.

### For Flexibility: **Direct API Calls**
Build your own lightweight abstraction (Option 3 above).

### For Maximum Models: **OpenRouter**
One API key, 100+ models, minimal code.

---

## Updated Model List in Your Form

```typescript
// app/competitions/create/_components/competition-create-form.tsx
<SelectContent>
  {/* Exact model names */}
  <SelectItem value="gpt-4o-mini">GPT-4o Mini (Cheapest)</SelectItem>
  <SelectItem value="gpt-4o">GPT-4o (Balanced)</SelectItem>
  <SelectItem value="gpt-4-turbo">GPT-4 Turbo (Smart)</SelectItem>
  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Legacy)</SelectItem>

  <SelectItem value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Best)</SelectItem>
  <SelectItem value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Fast)</SelectItem>
  <SelectItem value="claude-3-opus-20240229">Claude 3 Opus (Powerful)</SelectItem>

  <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
  <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
</SelectContent>
```

---

## Don't Use LiteLLM in Node.js!

LiteLLM = Python only.

For Node.js, use:
- Vercel AI SDK (cleanest)
- LangChain.js (most features)
- Direct APIs (most control)
- OpenRouter (most models)