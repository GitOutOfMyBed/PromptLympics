/**
 * LLM Interface Module
 * Provides unified interface for calling OpenAI, Anthropic, and Google models.
 * Handles model selection, API keys, and cost estimation.
 */

import { generateText } from 'ai'
import { openai, createOpenAI } from '@ai-sdk/openai'
import { anthropic, createAnthropic } from '@ai-sdk/anthropic'
import { google, createGoogleGenerativeAI } from '@ai-sdk/google'

export interface LLMCallOptions {
  model: string
  prompt: string
  temperature?: number
  apiKey?: string  // Optional custom API key
}

/**
 * Supported models with their exact names and cost information
 */
export const SUPPORTED_MODELS = {
  // OpenAI Models
  'gpt-4o': {
    provider: 'openai',
    displayName: 'GPT-4o (Latest)',
    costPerMillion: { input: 2.5, output: 10 },
  },
  'gpt-4o-mini': {
    provider: 'openai',
    displayName: 'GPT-4o Mini (Cheapest)',
    costPerMillion: { input: 0.15, output: 0.6 },
  },
  'gpt-4-turbo': {
    provider: 'openai',
    displayName: 'GPT-4 Turbo',
    costPerMillion: { input: 10, output: 30 },
  },
  'gpt-3.5-turbo': {
    provider: 'openai',
    displayName: 'GPT-3.5 Turbo (Legacy)',
    costPerMillion: { input: 0.5, output: 1.5 },
  },

  // Anthropic Models
  'claude-3-5-sonnet-20241022': {
    provider: 'anthropic',
    displayName: 'Claude 3.5 Sonnet (Best)',
    costPerMillion: { input: 3, output: 15 },
  },
  'claude-3-5-haiku-20241022': {
    provider: 'anthropic',
    displayName: 'Claude 3.5 Haiku (Fast)',
    costPerMillion: { input: 1, output: 5 },
  },
  'claude-3-opus-20240229': {
    provider: 'anthropic',
    displayName: 'Claude 3 Opus (Powerful)',
    costPerMillion: { input: 15, output: 75 },
  },

  // Google Models
  'gemini-1.5-pro': {
    provider: 'google',
    displayName: 'Gemini 1.5 Pro',
    costPerMillion: { input: 1.25, output: 5 },
  },
  'gemini-1.5-flash': {
    provider: 'google',
    displayName: 'Gemini 1.5 Flash',
    costPerMillion: { input: 0.075, output: 0.3 },
  },
} as const

export type SupportedModel = keyof typeof SUPPORTED_MODELS

/**
 * Get the appropriate AI SDK model instance for the given model name
 * @param modelName - The model identifier (e.g., "gpt-4o-mini")
 * @param apiKey - Optional custom API key to use instead of environment variable
 */
function getModel(modelName: string, apiKey?: string) {
  const modelConfig = SUPPORTED_MODELS[modelName as SupportedModel]

  if (!modelConfig) {
    throw new Error(`Unsupported model: ${modelName}. Supported models: ${Object.keys(SUPPORTED_MODELS).join(', ')}`)
  }

  switch (modelConfig.provider) {
    case 'openai':
      // Use custom API key if provided, otherwise use default from env
      if (apiKey) {
        const customOpenAI = createOpenAI({ apiKey })
        return customOpenAI(modelName)
      }
      return openai(modelName)

    case 'anthropic':
      // Use custom API key if provided, otherwise use default from env
      if (apiKey) {
        const customAnthropic = createAnthropic({ apiKey })
        return customAnthropic(modelName)
      }
      return anthropic(modelName)

    case 'google':
      // Use custom API key if provided, otherwise use default from env
      if (apiKey) {
        const customGoogle = createGoogleGenerativeAI({ apiKey })
        return customGoogle(modelName)
      }
      return google(modelName)

    default:
      throw new Error(`Unknown provider for model: ${modelName}`)
  }
}

/**
 * Call an LLM using the Vercel AI SDK
 */
export async function callLLM(options: LLMCallOptions): Promise<string> {
  const {
    model,
    prompt,
    temperature = 0,
    apiKey,  // Extract custom API key if provided
  } = options

  try {
    const { text } = await generateText({
      model: getModel(model, apiKey),  // Pass API key to getModel
      prompt,
      temperature,
    })

    return text.trim()
  } catch (error) {
    console.error(`LLM call failed for model ${model}:`, error)
    throw new Error(`LLM API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Estimate the cost of an LLM call based on token counts
 * @param model - The model name
 * @param inputTokens - Estimated input token count
 * @param outputTokens - Estimated output token count
 * @returns Cost in USD
 */
export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const modelConfig = SUPPORTED_MODELS[model as SupportedModel]

  if (!modelConfig) {
    console.warn(`Unknown model for cost estimation: ${model}`)
    return 0
  }

  const inputCost = (inputTokens / 1_000_000) * modelConfig.costPerMillion.input
  const outputCost = (outputTokens / 1_000_000) * modelConfig.costPerMillion.output

  return inputCost + outputCost
}

/**
 * Get a list of all supported models for UI dropdowns
 */
export function getSupportedModelsList() {
  return Object.entries(SUPPORTED_MODELS).map(([value, config]) => ({
    value,
    label: config.displayName,
    provider: config.provider,
    estimatedCost: estimateCost(value, 1000, 500), // Example: 1000 input, 500 output tokens
  }))
}

/**
 * Validate if a model is supported
 */
export function isModelSupported(model: string): model is SupportedModel {
  return model in SUPPORTED_MODELS
}