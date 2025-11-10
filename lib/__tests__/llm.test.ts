import { callLLM, estimateCost, getSupportedModelsList, isModelSupported, SUPPORTED_MODELS } from '../llm'
import { generateText } from 'ai'

// Mock the AI SDK
jest.mock('ai', () => ({
  generateText: jest.fn(),
}))

jest.mock('@ai-sdk/openai', () => ({
  openai: jest.fn((model: string) => ({ provider: 'openai', model })),
}))

jest.mock('@ai-sdk/anthropic', () => ({
  anthropic: jest.fn((model: string) => ({ provider: 'anthropic', model })),
}))

jest.mock('@ai-sdk/google', () => ({
  google: jest.fn((model: string) => ({ provider: 'google', model })),
}))

describe('LLM Module', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('callLLM', () => {
    it('should call generateText with correct parameters for OpenAI model', async () => {
      const mockText = 'Test response'
      ;(generateText as jest.Mock).mockResolvedValue({ text: mockText })

      const result = await callLLM({
        model: 'gpt-4o-mini',
        prompt: 'Test prompt',
        temperature: 0.5,
      })

      expect(generateText).toHaveBeenCalledWith({
        model: expect.objectContaining({
          provider: 'openai',
          model: 'gpt-4o-mini',
        }),
        prompt: 'Test prompt',
        temperature: 0.5,
      })
      expect(result).toBe(mockText)
    })

    it('should call generateText with correct parameters for Anthropic model', async () => {
      const mockText = 'Claude response'
      ;(generateText as jest.Mock).mockResolvedValue({ text: mockText })

      const result = await callLLM({
        model: 'claude-3-5-sonnet-20241022',
        prompt: 'Another test',
      })

      expect(generateText).toHaveBeenCalledWith({
        model: expect.objectContaining({
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-20241022',
        }),
        prompt: 'Another test',
        temperature: 0,
      })
      expect(result).toBe(mockText)
    })

    it('should throw error for unsupported model', async () => {
      await expect(
        callLLM({
          model: 'unsupported-model',
          prompt: 'Test',
        })
      ).rejects.toThrow('Unsupported model: unsupported-model')
    })

    it('should handle API errors gracefully', async () => {
      const errorMessage = 'API rate limit exceeded'
      ;(generateText as jest.Mock).mockRejectedValue(new Error(errorMessage))

      await expect(
        callLLM({
          model: 'gpt-4o',
          prompt: 'Test',
        })
      ).rejects.toThrow(`LLM API error: ${errorMessage}`)
    })
  })

  describe('estimateCost', () => {
    it('should calculate cost correctly for GPT-4o-mini', () => {
      const cost = estimateCost('gpt-4o-mini', 1000, 500)
      // Input: (1000 / 1,000,000) * 0.15 = 0.00015
      // Output: (500 / 1,000,000) * 0.6 = 0.0003
      // Total: 0.00045
      expect(cost).toBeCloseTo(0.00045, 6)
    })

    it('should calculate cost correctly for Claude 3.5 Sonnet', () => {
      const cost = estimateCost('claude-3-5-sonnet-20241022', 2000, 1000)
      // Input: (2000 / 1,000,000) * 3 = 0.006
      // Output: (1000 / 1,000,000) * 15 = 0.015
      // Total: 0.021
      expect(cost).toBeCloseTo(0.021, 6)
    })

    it('should return 0 for unknown models', () => {
      const cost = estimateCost('unknown-model', 1000, 500)
      expect(cost).toBe(0)
    })
  })

  describe('getSupportedModelsList', () => {
    it('should return all supported models with correct structure', () => {
      const models = getSupportedModelsList()

      expect(models).toHaveLength(Object.keys(SUPPORTED_MODELS).length)

      models.forEach(model => {
        expect(model).toHaveProperty('value')
        expect(model).toHaveProperty('label')
        expect(model).toHaveProperty('provider')
        expect(model).toHaveProperty('estimatedCost')
      })
    })

    it('should include all major providers', () => {
      const models = getSupportedModelsList()
      const providers = [...new Set(models.map(m => m.provider))]

      expect(providers).toContain('openai')
      expect(providers).toContain('anthropic')
      expect(providers).toContain('google')
    })
  })

  describe('isModelSupported', () => {
    it('should return true for supported models', () => {
      expect(isModelSupported('gpt-4o')).toBe(true)
      expect(isModelSupported('gpt-4o-mini')).toBe(true)
      expect(isModelSupported('claude-3-5-sonnet-20241022')).toBe(true)
      expect(isModelSupported('gemini-1.5-pro')).toBe(true)
    })

    it('should return false for unsupported models', () => {
      expect(isModelSupported('gpt-5')).toBe(false)
      expect(isModelSupported('random-model')).toBe(false)
      expect(isModelSupported('')).toBe(false)
    })
  })
})