/**
 * LLM Interface Module
 * Provides unified interface for calling OpenAI, Anthropic, and Google models.
 * Handles model selection, API keys, and cost estimation.
 */

import { generateText } from "ai";
import { openai, createOpenAI } from "@ai-sdk/openai";
import { anthropic, createAnthropic } from "@ai-sdk/anthropic";
import { google, createGoogleGenerativeAI } from "@ai-sdk/google";

export interface LLMCallOptions {
  model: string;
  prompt: string;
  temperature?: number;
  apiKey?: string; // Optional custom API key
}

/**
 * Supported models with their exact names and cost information
 */
export const SUPPORTED_MODELS = {
  // OpenAI Models
  "gpt-5": {
    provider: "openai",
    displayName: "gpt-5",
    costPerMillion: { input: 2.5, output: 10 },
  },
  "gpt-5-mini": {
    provider: "openai",
    displayName: "gpt-5-mini",
    costPerMillion: { input: 0.15, output: 0.6 },
  },
  "gpt-5-codex": {
    provider: "openai",
    displayName: "gpt-5-codex",
    costPerMillion: { input: 0.5, output: 1.5 },
  },

  // Anthropic Models
  "claude-sonnet-4.5": {
    provider: "anthropic",
    displayName: "claude-sonnet-4.5",
    costPerMillion: { input: 3, output: 15 },
  },
  "claude-haiku-4.5": {
    provider: "anthropic",
    displayName: "claude-haiku-4.5",
    costPerMillion: { input: 1, output: 5 },
  },

  // Google Models
  "gemini-2.5-pro": {
    provider: "google",
    displayName: "gemini-2.5-pro",
    costPerMillion: { input: 1.25, output: 10 },
  },

  "gemini-2.5-flash": {
    provider: "google",
    displayName: "gemini-2.5-flash",
    costPerMillion: { input: 1.25, output: 5 },
  },
  "gemini-1.5-flash-latest": {
    provider: "google",
    displayName: "gemini-2.5-flash-lite",
    costPerMillion: { input: 0.075, output: 0.3 },
  },
} as const;

export type SupportedModel = keyof typeof SUPPORTED_MODELS;

/**
 * Get the appropriate AI SDK model instance for the given model name
 * @param modelName - The model identifier (e.g., "gpt-4o-mini")
 * @param apiKey - Optional custom API key to use instead of environment variable
 */
function getModel(modelName: string, apiKey?: string) {
  const modelConfig = SUPPORTED_MODELS[modelName as SupportedModel];

  if (!modelConfig) {
    throw new Error(
      `Unsupported model: ${modelName}. Supported models: ${Object.keys(
        SUPPORTED_MODELS
      ).join(", ")}`
    );
  }

  switch (modelConfig.provider) {
    case "openai":
      // Use custom API key if provided, otherwise use default from env
      if (apiKey) {
        const customOpenAI = createOpenAI({ apiKey });
        return customOpenAI(modelName);
      }
      return openai(modelName);

    case "anthropic":
      // Use custom API key if provided, otherwise use default from env
      if (apiKey) {
        const customAnthropic = createAnthropic({ apiKey });
        return customAnthropic(modelName);
      }
      return anthropic(modelName);

    case "google":
      // Use custom API key if provided, otherwise use default from env
      if (apiKey) {
        const customGoogle = createGoogleGenerativeAI({ apiKey });
        return customGoogle(modelName);
      }
      return google(modelName);

    default:
      throw new Error(`Unknown provider for model: ${modelName}`);
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
    apiKey, // Extract custom API key if provided
  } = options;

  try {
    const { text } = await generateText({
      model: getModel(model, apiKey), // Pass API key to getModel
      prompt,
      temperature,
    });

    return text.trim();
  } catch (error) {
    console.error(`LLM call failed for model ${model}:`, error);
    throw new Error(
      `LLM API error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
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
  const modelConfig = SUPPORTED_MODELS[model as SupportedModel];

  if (!modelConfig) {
    console.warn(`Unknown model for cost estimation: ${model}`);
    return 0;
  }

  const inputCost =
    (inputTokens / 1_000_000) * modelConfig.costPerMillion.input;
  const outputCost =
    (outputTokens / 1_000_000) * modelConfig.costPerMillion.output;

  return inputCost + outputCost;
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
  }));
}

/**
 * Validate if a model is supported
 */
export function isModelSupported(model: string): model is SupportedModel {
  return model in SUPPORTED_MODELS;
}
