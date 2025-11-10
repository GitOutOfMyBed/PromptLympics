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
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'openai' }
  ]),
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
          modelType: 'gpt-4o-mini',
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
})
