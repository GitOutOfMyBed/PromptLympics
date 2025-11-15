import { callLLM, estimateCost, getSupportedModelsList, isModelSupported, SUPPORTED_MODELS } from '../llm'

const mockCreate = jest.fn()

// Mock OpenAI SDK
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }))
})

describe('LLM Module', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('callLLM', () => {
    it('should call OpenAI API with correct parameters for OpenAI model', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Test response' } }],
      })

      const result = await callLLM({
        model: 'gpt-5-mini',
        prompt: 'Test prompt',
        temperature: 0.5,
        apiKey: 'test-key',
      })

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-5-mini',
        messages: [{ role: 'user', content: 'Test prompt' }],
        temperature: 0.5,
      })
      expect(result).toBe('Test response')
    })

    it('should call OpenAI API with correct parameters for Anthropic model', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Claude response' } }],
      })

      const result = await callLLM({
        model: 'claude-sonnet-4.5',
        prompt: 'Another test',
        apiKey: 'test-key',
      })

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'claude-sonnet-4.5',
        messages: [{ role: 'user', content: 'Another test' }],
        temperature: 0,
      })
      expect(result).toBe('Claude response')
    })

    it('should throw error for unsupported model without baseURL', async () => {
      await expect(
        callLLM({
          model: 'unsupported-model',
          prompt: 'Test',
          apiKey: 'test-key',
        })
      ).rejects.toThrow('Model "unsupported-model" is not supported')
    })

    it('should require API key', async () => {
      await expect(
        callLLM({
          model: 'gpt-5',
          prompt: 'Test',
        })
      ).rejects.toThrow('API key is required')
    })

    it('should handle API errors gracefully', async () => {
      const errorMessage = 'API rate limit exceeded'
      mockCreate.mockRejectedValue(new Error(errorMessage))

      await expect(
        callLLM({
          model: 'gpt-5',
          prompt: 'Test',
          apiKey: 'test-key',
        })
      ).rejects.toThrow(errorMessage)
    })
  })

  describe('estimateCost', () => {
    it('should calculate cost correctly for GPT-5-mini', () => {
      const cost = estimateCost('gpt-5-mini', 1000, 500)
      // Input: (1000 / 1,000,000) * 0.15 = 0.00015
      // Output: (500 / 1,000,000) * 0.6 = 0.0003
      // Total: 0.00045
      expect(cost).toBeCloseTo(0.00045, 6)
    })

    it('should calculate cost correctly for Claude Sonnet 4.5', () => {
      const cost = estimateCost('claude-sonnet-4.5', 2000, 1000)
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
      const providers = Array.from(new Set(models.map(m => m.provider)))

      expect(providers).toContain('openai')
      expect(providers).toContain('anthropic')
      expect(providers).toContain('google')
    })
  })

  describe('isModelSupported', () => {
    it('should return true for supported models', () => {
      expect(isModelSupported('gpt-5')).toBe(true)
      expect(isModelSupported('gpt-5-mini')).toBe(true)
      expect(isModelSupported('claude-sonnet-4.5')).toBe(true)
      expect(isModelSupported('gemini-2.5-flash')).toBe(true)
    })

    it('should return false for unsupported models', () => {
      expect(isModelSupported('gpt-4o')).toBe(false)
      expect(isModelSupported('random-model')).toBe(false)
      expect(isModelSupported('')).toBe(false)
    })
  })
})
