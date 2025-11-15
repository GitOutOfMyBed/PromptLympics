/**
 * LLM Interface Module
 * Provides unified interface for calling OpenAI, Anthropic, and Google models.
 * Uses OpenAI SDK with custom base URLs for different providers.
 */

import OpenAI from "openai";

export interface LLMCallOptions {
  model: string;
  prompt: string;
  temperature?: number;
  apiKey?: string; // Optional custom API key
  baseURL?: string; // Optional custom base URL (e.g., for OpenRouter)
  headers?: Record<string, string>; // Optional custom headers
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
    baseURL: "https://api.openai.com/v1",
  },
  "gpt-5-mini": {
    provider: "openai",
    displayName: "gpt-5-mini",
    costPerMillion: { input: 0.15, output: 0.6 },
    baseURL: "https://api.openai.com/v1",
  },
  "gpt-5-codex": {
    provider: "openai",
    displayName: "gpt-5-codex",
    costPerMillion: { input: 0.5, output: 1.5 },
    baseURL: "https://api.openai.com/v1",
  },

  // Anthropic Models (via OpenAI-compatible endpoint)
  "claude-sonnet-4.5": {
    provider: "anthropic",
    displayName: "claude-sonnet-4.5",
    costPerMillion: { input: 3, output: 15 },
    baseURL: "https://api.anthropic.com/v1",
  },
  "claude-haiku-4.5": {
    provider: "anthropic",
    displayName: "claude-haiku-4.5",
    costPerMillion: { input: 1, output: 5 },
    baseURL: "https://api.anthropic.com/v1",
  },

  // Google Models (via OpenAI-compatible endpoint)
  "gemini-2.5-pro": {
    provider: "google",
    displayName: "gemini-2.5-pro",
    costPerMillion: { input: 1.25, output: 10 },
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  },
  "gemini-2.5-flash": {
    provider: "google",
    displayName: "gemini-2.5-flash",
    costPerMillion: { input: 1.25, output: 5 },
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  },
  "gemini-1.5-flash-latest": {
    provider: "google",
    displayName: "gemini-2.5-flash-lite",
    costPerMillion: { input: 0.075, output: 0.3 },
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  },
} as const;

export type SupportedModel = keyof typeof SUPPORTED_MODELS;

/**
 * Call an LLM using the OpenAI SDK
 * Works with OpenAI, Anthropic, Google, OpenRouter, and any OpenAI-compatible API
 *
 * IMPORTANT: apiKey is required. In production, this is always the user's encrypted key
 * that has been decrypted during evaluation.
 */
export async function callLLM(options: LLMCallOptions): Promise<string> {
  const {
    model,
    prompt,
    temperature = 0,
    apiKey,
    baseURL,
    headers,
  } = options;

  if (!apiKey) {
    throw new Error("API key is required for LLM calls");
  }

  try {
    // Determine base URL
    let finalBaseURL = baseURL;

    // If no custom baseURL provided, must be a supported model
    if (!finalBaseURL) {
      const modelConfig = SUPPORTED_MODELS[model as SupportedModel];
      if (!modelConfig) {
        throw new Error(
          `Model "${model}" is not supported. Either use a supported model or provide a custom baseURL. ` +
          `Supported models: ${Object.keys(SUPPORTED_MODELS).join(", ")}`
        );
      }
      finalBaseURL = modelConfig.baseURL;
    }

    // Create OpenAI client with configuration
    const client = new OpenAI({
      apiKey,
      baseURL: finalBaseURL,
      defaultHeaders: headers,
    });

    // Call the API
    const completion = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in response");
    }

    return content.trim();
  } catch (error) {
    console.error(`LLM call failed for model ${model}:`, error);

    // Extract user-friendly error message
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
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
