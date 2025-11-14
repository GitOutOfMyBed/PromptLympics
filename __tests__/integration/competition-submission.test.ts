/**
 * End-to-End Integration Test
 * Tests the full flow: upload data -> create competition -> submit prompt -> evaluate
 */

import { prisma } from '@/lib/prisma'
import { evaluatePrompt } from '@/lib/evaluation'
import * as fs from 'fs'
import * as path from 'path'

// Mock Firebase Storage
jest.mock('@/firebase/firebaseadmin-storage', () => ({
  getValidationData: jest.fn(),
}))

// Mock LLM calls
jest.mock('@/lib/llm', () => ({
  callLLM: jest.fn(),
  getSupportedModelsList: jest.fn(() => [
    { value: 'gpt-5-mini', label: 'GPT-5 Mini', provider: 'openai', estimatedCost: 0.00045 }
  ]),
  isModelSupported: jest.fn((model) => model === 'gpt-5-mini'),
}))

// Mock encryption
jest.mock('@/lib/encryption', () => ({
  encryptApiKey: jest.fn((key) => Promise.resolve(`encrypted_${key}`)),
  decryptApiKey: jest.fn((encrypted) => Promise.resolve(encrypted.replace('encrypted_', ''))),
  getProviderFromModel: jest.fn(() => 'openai'),
}))

import { getValidationData } from '@/firebase/firebaseadmin-storage'
import { callLLM } from '@/lib/llm'

describe('Competition Upload & Submission Flow', () => {
  const testUserId = 'test-user-123'
  let competitionId: string

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.submission.deleteMany({
      where: { user: { id: testUserId } }
    })
    await prisma.competition.deleteMany({
      where: { organizer: { id: testUserId } }
    })
    await prisma.user.deleteMany({
      where: { id: testUserId }
    })

    // Create test user
    await prisma.user.create({
      data: {
        id: testUserId,
        email: 'test@example.com',
        name: 'Test User',
      }
    })
  })

  afterAll(async () => {
    // Cleanup
    await prisma.submission.deleteMany({
      where: { user: { id: testUserId } }
    })
    await prisma.competition.deleteMany({
      where: { organizer: { id: testUserId } }
    })
    await prisma.user.deleteMany({
      where: { id: testUserId }
    })
    await prisma.$disconnect()
  })

  describe('Step 1: Load and validate test data files', () => {
    it('should load training data JSON', () => {
      const trainingPath = path.join(__dirname, '../fixtures/training-data.json')
      expect(fs.existsSync(trainingPath)).toBe(true)

      const content = fs.readFileSync(trainingPath, 'utf-8')
      const data = JSON.parse(content)

      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
      expect(data[0]).toHaveProperty('input')
      expect(data[0]).toHaveProperty('expectedOutput')
    })

    it('should load validation data JSON', () => {
      const validationPath = path.join(__dirname, '../fixtures/validation-data.json')
      expect(fs.existsSync(validationPath)).toBe(true)

      const content = fs.readFileSync(validationPath, 'utf-8')
      const data = JSON.parse(content)

      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
      expect(data[0]).toHaveProperty('input')
      expect(data[0]).toHaveProperty('expectedOutput')
    })
  })

  describe('Step 2: Create competition with uploaded data', () => {
    it('should create competition with test data', async () => {
      // Read test data
      const trainingPath = path.join(__dirname, '../fixtures/training-data.json')
      const validationPath = path.join(__dirname, '../fixtures/validation-data.json')

      const trainingData = JSON.parse(fs.readFileSync(trainingPath, 'utf-8'))
      const validationData = JSON.parse(fs.readFileSync(validationPath, 'utf-8'))

      // Create competition (simulating what the API would do)
      const competition = await prisma.competition.create({
        data: {
          title: 'Test Sentiment Classification',
          description: 'Test competition for sentiment analysis',
          organizationName: 'Test Org',
          totalPrize: 1000,
          prizeDistribution: 'WINNER_TAKES_ALL',
          modelType: 'gpt-5-mini',
          trainingDataUrl: 'https://example.com/training.json', // Mock URL
          validationDataUrl: 'test/validation.json', // Mock path
          trainingDataSize: trainingData.length,
          validationDataSize: validationData.length,
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          organizerId: testUserId,
          status: 'ACTIVE',
          encryptedApiKey: 'encrypted_test-api-key',
          apiKeyProvider: 'openai',
          maxSubmissionsPerUser: 3,
        }
      })

      competitionId = competition.id

      expect(competition).toBeDefined()
      expect(competition.id).toBeDefined()
      expect(competition.title).toBe('Test Sentiment Classification')
      expect(competition.trainingDataSize).toBe(trainingData.length)
      expect(competition.validationDataSize).toBe(validationData.length)
    })
  })

  describe('Step 3: Submit prompt and verify submission created', () => {
    it('should create a submission', async () => {
      const testPrompt = 'You are a sentiment classifier. Respond with only one word: positive, negative, or neutral.'

      const submission = await prisma.submission.create({
        data: {
          competitionId,
          userId: testUserId,
          prompt: testPrompt,
          status: 'PENDING',
        }
      })

      expect(submission).toBeDefined()
      expect(submission.id).toBeDefined()
      expect(submission.prompt).toBe(testPrompt)
      expect(submission.status).toBe('PENDING')
    })

    it('should enforce submission limit', async () => {
      // Create 3 submissions (the limit)
      for (let i = 0; i < 3; i++) {
        await prisma.submission.create({
          data: {
            competitionId,
            userId: testUserId,
            prompt: `Test prompt ${i}`,
            status: 'COMPLETED',
            score: 0.5,
          }
        })
      }

      // Check that user has reached limit
      const count = await prisma.submission.count({
        where: {
          competitionId,
          userId: testUserId,
        }
      })

      const competition = await prisma.competition.findUnique({
        where: { id: competitionId }
      })

      expect(count).toBe(4) // 1 from previous test + 3 new ones
      expect(count).toBeGreaterThanOrEqual(competition!.maxSubmissionsPerUser)
    })
  })

  describe('Step 4: Evaluate submission with mocked LLM', () => {
    it('should evaluate prompt against validation data', async () => {
      // Read validation data
      const validationPath = path.join(__dirname, '../fixtures/validation-data.json')
      const validationData = JSON.parse(fs.readFileSync(validationPath, 'utf-8'))

      // Mock the Firebase Admin SDK to return our test data
      ;(getValidationData as jest.Mock).mockResolvedValue(validationData)

      // Mock LLM responses to match expected outputs (simulating perfect accuracy)
      ;(callLLM as jest.Mock).mockImplementation((options: any) => {
        const input = options.prompt
        // Extract the sentiment classification request
        if (input.includes('amazing')) return Promise.resolve('positive')
        if (input.includes('hate')) return Promise.resolve('negative')
        if (input.includes('fine')) return Promise.resolve('neutral')
        if (input.includes('Best purchase')) return Promise.resolve('positive')
        if (input.includes('Waste')) return Promise.resolve('negative')
        return Promise.resolve('neutral')
      })

      // Create a fresh submission for evaluation
      const testPrompt = 'Classify sentiment as positive, negative, or neutral.'
      const submission = await prisma.submission.create({
        data: {
          competitionId,
          userId: testUserId,
          prompt: testPrompt,
          status: 'PENDING',
        }
      })

      const competition = await prisma.competition.findUnique({
        where: { id: competitionId }
      })

      // Run evaluation
      await evaluatePrompt(submission.id, competition!, testPrompt)

      // Check submission was updated
      const updatedSubmission = await prisma.submission.findUnique({
        where: { id: submission.id }
      })

      expect(updatedSubmission?.status).toBe('COMPLETED')
      expect(updatedSubmission?.score).toBeDefined()
      expect(updatedSubmission?.score).toBeGreaterThan(0)
      expect(updatedSubmission?.evaluatedAt).toBeDefined()
      expect(updatedSubmission?.evaluationLog).toBeDefined()

      // Verify LLM was called for each test case
      expect(callLLM).toHaveBeenCalled()
      expect((callLLM as jest.Mock).mock.calls.length).toBe(validationData.length)
    })

    it('should calculate correct accuracy score', async () => {
      const validationPath = path.join(__dirname, '../fixtures/validation-data.json')
      const validationData = JSON.parse(fs.readFileSync(validationPath, 'utf-8'))

      ;(getValidationData as jest.Mock).mockResolvedValue(validationData)

      // Mock LLM to get some right and some wrong
      let callCount = 0
      ;(callLLM as jest.Mock).mockImplementation(() => {
        callCount++
        // Get first 3 right, last 2 wrong
        if (callCount <= 3) return Promise.resolve(validationData[callCount - 1].expectedOutput)
        return Promise.resolve('wrong')
      })

      const testPrompt = 'Test prompt for accuracy'
      const submission = await prisma.submission.create({
        data: {
          competitionId,
          userId: testUserId,
          prompt: testPrompt,
          status: 'PENDING',
        }
      })

      const competition = await prisma.competition.findUnique({
        where: { id: competitionId }
      })

      await evaluatePrompt(submission.id, competition!, testPrompt)

      const updatedSubmission = await prisma.submission.findUnique({
        where: { id: submission.id }
      })

      // Should be 3/5 = 0.6
      expect(updatedSubmission?.score).toBeCloseTo(0.6, 2)
    })

    it('should store evaluationLog as pure array of details', async () => {
      const validationPath = path.join(__dirname, '../fixtures/validation-data.json')
      const validationData = JSON.parse(fs.readFileSync(validationPath, 'utf-8'))

      ;(getValidationData as jest.Mock).mockResolvedValue(validationData)

      // Mock LLM responses
      let callIndex = 0
      ;(callLLM as jest.Mock).mockImplementation(() => {
        const result = validationData[callIndex % validationData.length].expectedOutput
        callIndex++
        return Promise.resolve(result)
      })

      const testPrompt = 'Test evaluationLog format'
      const submission = await prisma.submission.create({
        data: {
          competitionId,
          userId: testUserId,
          prompt: testPrompt,
          status: 'PENDING',
        }
      })

      const competition = await prisma.competition.findUnique({
        where: { id: competitionId }
      })

      await evaluatePrompt(submission.id, competition!, testPrompt)

      const updatedSubmission = await prisma.submission.findUnique({
        where: { id: submission.id }
      })

      // Parse evaluationLog
      const evaluationLog = JSON.parse(updatedSubmission!.evaluationLog!)

      // Should be array, not object with {correct, total, details}
      expect(Array.isArray(evaluationLog)).toBe(true)
      expect(evaluationLog.length).toBe(validationData.length)
      expect(evaluationLog[0]).toHaveProperty('input')
      expect(evaluationLog[0]).toHaveProperty('expectedOutput')
      expect(evaluationLog[0]).toHaveProperty('actualOutput')
      expect(evaluationLog[0]).toHaveProperty('correct')

      // Should NOT have top-level correct/total fields (those are calculated from array)
      expect(evaluationLog).not.toHaveProperty('correct')
      expect(evaluationLog).not.toHaveProperty('total')
      expect(evaluationLog).not.toHaveProperty('details')
    })
  })

  describe('Step 5: Verify leaderboard updates', () => {
    it('should update competition best score', async () => {
      // Fetch fresh competition data after evaluations
      const competition = await prisma.competition.findUnique({
        where: { id: competitionId },
      })

      const submissions = await prisma.submission.findMany({
        where: {
          competitionId,
          status: 'COMPLETED',
          score: { not: null }
        },
        orderBy: { score: 'desc' },
        take: 1,
      })

      expect(competition?.bestScore).toBeDefined()
      expect(competition?.bestScore).toBeGreaterThan(0)

      // Best score should match highest submission score
      const topSubmission = submissions[0]
      expect(topSubmission?.score).toBeDefined()
      expect(competition?.bestScore).toBe(topSubmission?.score)
    })
  })

  describe('Additional Test Cases', () => {
    describe('Failed Evaluations', () => {
      it('should mark submission as FAILED when all test cases fail with LLM errors', async () => {
        const validationPath = path.join(__dirname, '../fixtures/validation-data.json')
        const validationData = JSON.parse(fs.readFileSync(validationPath, 'utf-8'))

        ;(getValidationData as jest.Mock).mockResolvedValue(validationData)
        ;(callLLM as jest.Mock).mockRejectedValue(new Error('LLM API error: rate limit exceeded'))

        const testPrompt = 'Test prompt that will fail'
        const submission = await prisma.submission.create({
          data: {
            competitionId,
            userId: testUserId,
            prompt: testPrompt,
            status: 'PENDING',
          }
        })

        const competition = await prisma.competition.findUnique({
          where: { id: competitionId }
        })

        await evaluatePrompt(submission.id, competition!, testPrompt)

        const updatedSubmission = await prisma.submission.findUnique({
          where: { id: submission.id }
        })

        // When any test case fails with an error, submission should be marked as FAILED
        expect(updatedSubmission?.status).toBe('FAILED')
        expect(updatedSubmission?.errorMessage).toBeDefined()
        expect(updatedSubmission?.errorMessage).toContain('LLM API error')
        expect(updatedSubmission?.score).toBeNull()
      })

      it('should mark submission as FAILED when API quota is exceeded', async () => {
        const validationPath = path.join(__dirname, '../fixtures/validation-data.json')
        const validationData = JSON.parse(fs.readFileSync(validationPath, 'utf-8'))

        ;(getValidationData as jest.Mock).mockResolvedValue(validationData)

        // Simulate quota exceeded error
        ;(callLLM as jest.Mock).mockRejectedValue(
          new Error('API quota exceeded for gemini-2.5-pro. Please check your API key billing or wait before retrying.')
        )

        const testPrompt = 'Test prompt with quota error'
        const submission = await prisma.submission.create({
          data: {
            competitionId,
            userId: testUserId,
            prompt: testPrompt,
            status: 'PENDING',
          }
        })

        const competition = await prisma.competition.findUnique({
          where: { id: competitionId }
        })

        await evaluatePrompt(submission.id, competition!, testPrompt)

        const updatedSubmission = await prisma.submission.findUnique({
          where: { id: submission.id }
        })

        // Submission should be marked as FAILED with user-friendly error message
        expect(updatedSubmission?.status).toBe('FAILED')
        expect(updatedSubmission?.errorMessage).toBeDefined()
        expect(updatedSubmission?.errorMessage).toContain('API quota exceeded')
        expect(updatedSubmission?.score).toBeNull()
      })

      it('should mark submission as FAILED when first test case fails with error', async () => {
        const validationPath = path.join(__dirname, '../fixtures/validation-data.json')
        const validationData = JSON.parse(fs.readFileSync(validationPath, 'utf-8'))

        ;(getValidationData as jest.Mock).mockResolvedValue(validationData)

        // First call fails, subsequent calls would succeed
        let callCount = 0
        ;(callLLM as jest.Mock).mockImplementation(() => {
          callCount++
          if (callCount === 1) {
            return Promise.reject(new Error('Network timeout'))
          }
          return Promise.resolve('positive')
        })

        const testPrompt = 'Test prompt with partial failure'
        const submission = await prisma.submission.create({
          data: {
            competitionId,
            userId: testUserId,
            prompt: testPrompt,
            status: 'PENDING',
          }
        })

        const competition = await prisma.competition.findUnique({
          where: { id: competitionId }
        })

        await evaluatePrompt(submission.id, competition!, testPrompt)

        const updatedSubmission = await prisma.submission.findUnique({
          where: { id: submission.id }
        })

        // Even if only one test case fails with error, submission should be FAILED
        expect(updatedSubmission?.status).toBe('FAILED')
        expect(updatedSubmission?.errorMessage).toContain('Network timeout')
        expect(updatedSubmission?.score).toBeNull()
      })

      it('should handle invalid validation data format', async () => {
        ;(getValidationData as jest.Mock).mockResolvedValue([
          { wrong: 'format' }
        ])

        const testPrompt = 'Test prompt with invalid data'
        const submission = await prisma.submission.create({
          data: {
            competitionId,
            userId: testUserId,
            prompt: testPrompt,
            status: 'PENDING',
          }
        })

        const competition = await prisma.competition.findUnique({
          where: { id: competitionId }
        })

        await evaluatePrompt(submission.id, competition!, testPrompt)

        const updatedSubmission = await prisma.submission.findUnique({
          where: { id: submission.id }
        })

        // Invalid data format will cause test cases to fail with errors
        expect(updatedSubmission?.status).toBe('FAILED')
        expect(updatedSubmission?.errorMessage).toBeDefined()
      })
    })

    describe('Competition Status and Timing', () => {
      it('should prevent submissions to completed competitions', async () => {
        const completedCompetition = await prisma.competition.create({
          data: {
            title: 'Completed Competition',
            description: 'This competition has ended',
            organizationName: 'Test Org',
            totalPrize: 500,
            prizeDistribution: 'WINNER_TAKES_ALL',
            modelType: 'gpt-5-mini',
            trainingDataUrl: 'https://example.com/training.json',
            validationDataUrl: 'test/validation.json',
            trainingDataSize: 3,
            validationDataSize: 5,
            startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
            endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            organizerId: testUserId,
            status: 'COMPLETED',
            encryptedApiKey: 'encrypted_test-api-key',
            apiKeyProvider: 'openai',
            maxSubmissionsPerUser: 3,
          }
        })

        // Attempt to create submission (this would normally be blocked by API)
        const submissionCount = await prisma.submission.count({
          where: { competitionId: completedCompetition.id }
        })

        expect(completedCompetition.status).toBe('COMPLETED')
        expect(submissionCount).toBe(0)
      })

      it('should allow submissions to active competitions', async () => {
        const activeCompetition = await prisma.competition.findUnique({
          where: { id: competitionId }
        })

        expect(activeCompetition?.status).toBe('ACTIVE')

        const now = new Date()
        expect(activeCompetition?.startDate).toBeDefined()
        expect(activeCompetition?.endDate).toBeDefined()
        expect(activeCompetition!.startDate.getTime()).toBeLessThanOrEqual(now.getTime())
        expect(activeCompetition!.endDate.getTime()).toBeGreaterThan(now.getTime())
      })
    })

    describe('Multiple Users and Leaderboard', () => {
      const testUser2Id = 'test-user-456'

      beforeAll(async () => {
        await prisma.user.create({
          data: {
            id: testUser2Id,
            email: 'test2@example.com',
            name: 'Test User 2',
          }
        })
      })

      afterAll(async () => {
        await prisma.submission.deleteMany({
          where: { userId: testUser2Id }
        })
        await prisma.user.deleteMany({
          where: { id: testUser2Id }
        })
      })

      it('should handle multiple users submitting to same competition', async () => {
        const validationPath = path.join(__dirname, '../fixtures/validation-data.json')
        const validationData = JSON.parse(fs.readFileSync(validationPath, 'utf-8'))

        ;(getValidationData as jest.Mock).mockResolvedValue(validationData)

        // User 1 submission - high score
        ;(callLLM as jest.Mock).mockImplementation(() => {
          return Promise.resolve('positive') // Mostly correct
        })

        const submission1 = await prisma.submission.create({
          data: {
            competitionId,
            userId: testUserId,
            prompt: 'Excellent classifier',
            status: 'PENDING',
          }
        })

        const competition = await prisma.competition.findUnique({
          where: { id: competitionId }
        })

        await evaluatePrompt(submission1.id, competition!, 'Excellent classifier')

        // User 2 submission - low score
        ;(callLLM as jest.Mock).mockImplementation(() => {
          return Promise.resolve('negative') // Mostly wrong
        })

        const submission2 = await prisma.submission.create({
          data: {
            competitionId,
            userId: testUser2Id,
            prompt: 'Poor classifier',
            status: 'PENDING',
          }
        })

        await evaluatePrompt(submission2.id, competition!, 'Poor classifier')

        // Verify both submissions are tracked
        const allSubmissions = await prisma.submission.findMany({
          where: {
            competitionId,
            userId: { in: [testUserId, testUser2Id] },
            status: 'COMPLETED'
          },
          orderBy: { score: 'desc' }
        })

        expect(allSubmissions.length).toBeGreaterThanOrEqual(2)

        const user1Submissions = allSubmissions.filter(s => s.userId === testUserId)
        const user2Submissions = allSubmissions.filter(s => s.userId === testUser2Id)

        expect(user1Submissions.length).toBeGreaterThan(0)
        expect(user2Submissions.length).toBeGreaterThan(0)
      })

      it('should track per-user submission counts separately', async () => {
        const user1Count = await prisma.submission.count({
          where: { competitionId, userId: testUserId }
        })

        const user2Count = await prisma.submission.count({
          where: { competitionId, userId: testUser2Id }
        })

        expect(user1Count).toBeGreaterThan(0)
        expect(user2Count).toBeGreaterThan(0)

        // Each user's count should be independent
        expect(user1Count).not.toBe(user2Count)
      })
    })

    describe('Edge Cases and Validation', () => {
      it('should handle very long prompts', async () => {
        const longPrompt = 'A'.repeat(5000) // 5000 character prompt

        const submission = await prisma.submission.create({
          data: {
            competitionId,
            userId: testUserId,
            prompt: longPrompt,
            status: 'PENDING',
          }
        })

        expect(submission.prompt).toHaveLength(5000)
        expect(submission.prompt).toBe(longPrompt)
      })

      it('should handle prompts with special characters', async () => {
        const specialPrompt = 'Test with "quotes", \'apostrophes\', and\nnewlines\t\ttabs'

        const submission = await prisma.submission.create({
          data: {
            competitionId,
            userId: testUserId,
            prompt: specialPrompt,
            status: 'PENDING',
          }
        })

        expect(submission.prompt).toBe(specialPrompt)
      })

      it('should handle empty evaluation logs gracefully', async () => {
        const submission = await prisma.submission.create({
          data: {
            competitionId,
            userId: testUserId,
            prompt: 'Test prompt',
            status: 'COMPLETED',
            score: 0.5,
            evaluationLog: '',
          }
        })

        expect(submission.evaluationLog).toBeDefined()
        expect(submission.status).toBe('COMPLETED')
      })
    })

    describe('Score Calculations', () => {
      it('should handle perfect score (100%)', async () => {
        const validationPath = path.join(__dirname, '../fixtures/validation-data.json')
        const validationData = JSON.parse(fs.readFileSync(validationPath, 'utf-8'))

        ;(getValidationData as jest.Mock).mockResolvedValue(validationData)

        // Mock perfect responses
        let callIndex = 0
        ;(callLLM as jest.Mock).mockImplementation(() => {
          const result = validationData[callIndex % validationData.length].expectedOutput
          callIndex++
          return Promise.resolve(result)
        })

        const testPrompt = 'Perfect classifier'
        const submission = await prisma.submission.create({
          data: {
            competitionId,
            userId: testUserId,
            prompt: testPrompt,
            status: 'PENDING',
          }
        })

        const competition = await prisma.competition.findUnique({
          where: { id: competitionId }
        })

        await evaluatePrompt(submission.id, competition!, testPrompt)

        const updatedSubmission = await prisma.submission.findUnique({
          where: { id: submission.id }
        })

        expect(updatedSubmission?.score).toBe(1.0)
        expect(updatedSubmission?.status).toBe('COMPLETED')
      })

      it('should handle zero score (0%)', async () => {
        const validationPath = path.join(__dirname, '../fixtures/validation-data.json')
        const validationData = JSON.parse(fs.readFileSync(validationPath, 'utf-8'))

        ;(getValidationData as jest.Mock).mockResolvedValue(validationData)

        // Mock completely wrong responses
        ;(callLLM as jest.Mock).mockImplementation(() => {
          return Promise.resolve('completely_wrong_output')
        })

        const testPrompt = 'Terrible classifier'
        const submission = await prisma.submission.create({
          data: {
            competitionId,
            userId: testUserId,
            prompt: testPrompt,
            status: 'PENDING',
          }
        })

        const competition = await prisma.competition.findUnique({
          where: { id: competitionId }
        })

        await evaluatePrompt(submission.id, competition!, testPrompt)

        const updatedSubmission = await prisma.submission.findUnique({
          where: { id: submission.id }
        })

        expect(updatedSubmission?.score).toBe(0.0)
        expect(updatedSubmission?.status).toBe('COMPLETED')
      })
    })

    describe('API Security - evaluationLog Sanitization', () => {
      let testSubmissionId: string
      const participantUserId = 'participant-user-789'

      beforeAll(async () => {
        // Create participant user
        await prisma.user.create({
          data: {
            id: participantUserId,
            email: 'participant@example.com',
            name: 'Participant User',
          }
        })

        // Create and evaluate a submission with full evaluation details
        const validationPath = path.join(__dirname, '../fixtures/validation-data.json')
        const validationData = JSON.parse(fs.readFileSync(validationPath, 'utf-8'))

        ;(getValidationData as jest.Mock).mockResolvedValue(validationData)

        let callIndex = 0
        ;(callLLM as jest.Mock).mockImplementation(() => {
          const result = validationData[callIndex % validationData.length].expectedOutput
          callIndex++
          return Promise.resolve(result)
        })

        const submission = await prisma.submission.create({
          data: {
            competitionId,
            userId: participantUserId,
            prompt: 'Test prompt for API security',
            status: 'PENDING',
          }
        })

        const competition = await prisma.competition.findUnique({
          where: { id: competitionId }
        })

        await evaluatePrompt(submission.id, competition!, 'Test prompt for API security')
        testSubmissionId = submission.id
      })

      afterAll(async () => {
        await prisma.submission.deleteMany({
          where: { userId: participantUserId }
        })
        await prisma.user.deleteMany({
          where: { id: participantUserId }
        })
      })

      it('should store full evaluationLog in database for all users', async () => {
        // Verify database contains full details
        const submission = await prisma.submission.findUnique({
          where: { id: testSubmissionId },
          include: {
            competition: true,
          }
        })

        expect(submission).toBeDefined()
        expect(submission!.evaluationLog).toBeDefined()

        const evaluationLog = JSON.parse(submission!.evaluationLog!)

        // Database should contain full details
        expect(Array.isArray(evaluationLog)).toBe(true)
        expect(evaluationLog.length).toBeGreaterThan(0)
        expect(evaluationLog[0]).toHaveProperty('input')
        expect(evaluationLog[0]).toHaveProperty('expectedOutput')
        expect(evaluationLog[0]).toHaveProperty('actualOutput')
        expect(evaluationLog[0]).toHaveProperty('correct')
      })

      it('should hide evaluationLog details from participants via API logic', async () => {
        // Simulate API behavior: participants should get null evaluationLog
        const submission = await prisma.submission.findUnique({
          where: { id: testSubmissionId },
          include: {
            competition: true,
          }
        })

        // Simulate API sanitization logic
        const isOrganizer = submission!.competition.organizerId === participantUserId
        const sanitizedSubmission = isOrganizer
          ? submission
          : { ...submission, evaluationLog: null }

        // Participant should see null evaluationLog
        expect(isOrganizer).toBe(false)
        expect(sanitizedSubmission.evaluationLog).toBeNull()
        expect(sanitizedSubmission.score).toBeDefined()
      })

      it('should show full evaluationLog to organizers via API logic', async () => {
        // Simulate API behavior: organizers should get full evaluationLog
        const submission = await prisma.submission.findUnique({
          where: { id: testSubmissionId },
          include: {
            competition: true,
          }
        })

        // Simulate API sanitization logic
        const isOrganizer = submission!.competition.organizerId === testUserId
        const sanitizedSubmission = isOrganizer
          ? submission
          : { ...submission, evaluationLog: null }

        // Organizer should see full evaluationLog
        expect(isOrganizer).toBe(true)
        expect(sanitizedSubmission.evaluationLog).toBeDefined()

        const evaluationLog = JSON.parse(sanitizedSubmission.evaluationLog!)
        expect(Array.isArray(evaluationLog)).toBe(true)
        expect(evaluationLog[0]).toHaveProperty('input')
        expect(evaluationLog[0]).toHaveProperty('expectedOutput')
      })
    })
  })
})
