/**
 * API Integration Tests
 * Ensures API endpoints work correctly in production-like conditions
 */

describe('API Integration', () => {
  it('GET /api/competitions should return competitions with all fields', async () => {
    // This test should be run against a test database or mock
    // For now, we'll just validate the structure

    const response = await fetch('http://localhost:3000/api/competitions')

    expect(response.status).toBe(200)

    const data = await response.json()

    // Should be an array
    expect(Array.isArray(data)).toBe(true)

    // If there are competitions, validate structure
    if (data.length > 0) {
      const competition = data[0]

      // Required fields
      expect(competition).toHaveProperty('id')
      expect(competition).toHaveProperty('title')
      expect(competition).toHaveProperty('description')
      expect(competition).toHaveProperty('status')
      expect(competition).toHaveProperty('organizerId')
      expect(competition).toHaveProperty('modelType')

      // Fields that caused the production error
      expect(competition).toHaveProperty('customBaseUrl')
      expect(competition).toHaveProperty('customHeaders')

      // Should not expose encrypted API key
      expect(competition).not.toHaveProperty('encryptedApiKey')
    }
  })
})
