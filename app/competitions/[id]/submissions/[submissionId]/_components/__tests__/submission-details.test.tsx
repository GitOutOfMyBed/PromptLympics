/**
 * UI Component Test for Submission Details
 * Tests that FAILED status and error messages are displayed correctly
 */

import { render, screen } from '@testing-library/react'
import { SubmissionDetails } from '../submission-details'
import type { SubmissionWithRelations } from '@/lib/types'

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: any) => {
    return <a href={href}>{children}</a>
  }
  MockLink.displayName = 'Link'
  return MockLink
})

describe('SubmissionDetails Component', () => {
  const mockCompetition = {
    id: 'comp-1',
    title: 'Test Competition',
    organizerId: 'organizer-123',
    description: 'Test description',
    organizationName: 'Test Org',
    totalPrize: 1000,
    firstPlacePrize: null,
    secondPlacePrize: null,
    thirdPlacePrize: null,
    prizeDistribution: 'WINNER_TAKES_ALL' as const,
    minimumScore: null,
    targetScore: null,
    maxSubmissionsPerUser: 3,
    starterPrompt: null,
    characterLimit: null,
    tokenLimit: null,
    customModelUrl: null,
    modelType: 'gpt-5-mini',
    trainingDataUrl: 'https://example.com/training.json',
    validationDataUrl: 'https://example.com/validation.json',
    trainingDataSize: 10,
    validationDataSize: 5,
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: 'ACTIVE' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    bestScore: null,
    bestSubmissionId: null,
    encryptedApiKey: 'encrypted-key',
    apiKeyProvider: 'openai',
  }

  describe('FAILED Status Display', () => {
    it('should display FAILED badge for failed submissions', () => {
      const failedSubmission: SubmissionWithRelations = {
        id: 'sub-1',
        competitionId: 'comp-1',
        userId: 'user-123',
        prompt: 'Test prompt',
        status: 'FAILED',
        score: null,
        errorMessage: 'API quota exceeded for gemini-2.5-pro. Please check your API key billing or wait before retrying.',
        evaluationLog: null,
        submittedAt: new Date(),
        evaluatedAt: null,
        competition: mockCompetition,
        user: {
          email: 'test@example.com',
          name: 'Test User',
        },
      }

      render(
        <SubmissionDetails
          submission={failedSubmission}
          currentUserId="user-123"
        />
      )

      // Check that FAILED badge is displayed
      expect(screen.getByText('FAILED')).toBeInTheDocument()
    })

    it('should display error message for failed submissions', () => {
      const errorMessage = 'API quota exceeded for gemini-2.5-pro. Please check your API key billing or wait before retrying.'
      const failedSubmission: SubmissionWithRelations = {
        id: 'sub-1',
        competitionId: 'comp-1',
        userId: 'user-123',
        prompt: 'Test prompt',
        status: 'FAILED',
        score: null,
        errorMessage,
        evaluationLog: null,
        submittedAt: new Date(),
        evaluatedAt: null,
        competition: mockCompetition,
        user: {
          email: 'test@example.com',
          name: 'Test User',
        },
      }

      render(
        <SubmissionDetails
          submission={failedSubmission}
          currentUserId="user-123"
        />
      )

      // Check that error message is displayed
      expect(screen.getByText('Error')).toBeInTheDocument()
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    it('should not display score for failed submissions', () => {
      const failedSubmission: SubmissionWithRelations = {
        id: 'sub-1',
        competitionId: 'comp-1',
        userId: 'user-123',
        prompt: 'Test prompt',
        status: 'FAILED',
        score: null,
        errorMessage: 'Network timeout',
        evaluationLog: null,
        submittedAt: new Date(),
        evaluatedAt: null,
        competition: mockCompetition,
        user: {
          email: 'test@example.com',
          name: 'Test User',
        },
      }

      render(
        <SubmissionDetails
          submission={failedSubmission}
          currentUserId="user-123"
        />
      )

      // Check that score shows "-" instead of a percentage
      const scoreSection = screen.getByText('Score').closest('div')
      expect(scoreSection).toHaveTextContent('-')
    })
  })

  describe('COMPLETED Status Display', () => {
    it('should display score for completed submissions', () => {
      const completedSubmission: SubmissionWithRelations = {
        id: 'sub-1',
        competitionId: 'comp-1',
        userId: 'user-123',
        prompt: 'Test prompt',
        status: 'COMPLETED',
        score: 0.75,
        errorMessage: null,
        evaluationLog: JSON.stringify([
          {
            input: 'test',
            expectedOutput: 'positive',
            actualOutput: 'positive',
            correct: true,
          },
        ]),
        submittedAt: new Date(),
        evaluatedAt: new Date(),
        competition: mockCompetition,
        user: {
          email: 'test@example.com',
          name: 'Test User',
        },
      }

      render(
        <SubmissionDetails
          submission={completedSubmission}
          currentUserId="user-123"
        />
      )

      // Check that score is displayed as percentage
      expect(screen.getByText('75.0%')).toBeInTheDocument()
      expect(screen.getByText('COMPLETED')).toBeInTheDocument()
    })

    it('should not display error message for completed submissions', () => {
      const completedSubmission: SubmissionWithRelations = {
        id: 'sub-1',
        competitionId: 'comp-1',
        userId: 'user-123',
        prompt: 'Test prompt',
        status: 'COMPLETED',
        score: 0.5,
        errorMessage: null,
        evaluationLog: '[]',
        submittedAt: new Date(),
        evaluatedAt: new Date(),
        competition: mockCompetition,
        user: {
          email: 'test@example.com',
          name: 'Test User',
        },
      }

      render(
        <SubmissionDetails
          submission={completedSubmission}
          currentUserId="user-123"
        />
      )

      // Check that error section is not displayed
      expect(screen.queryByText('Error')).not.toBeInTheDocument()
    })
  })

  describe('EVALUATING Status Display', () => {
    it('should display loading indicator for evaluating submissions', () => {
      const evaluatingSubmission: SubmissionWithRelations = {
        id: 'sub-1',
        competitionId: 'comp-1',
        userId: 'user-123',
        prompt: 'Test prompt',
        status: 'EVALUATING',
        score: null,
        errorMessage: null,
        evaluationLog: null,
        submittedAt: new Date(),
        evaluatedAt: null,
        competition: mockCompetition,
        user: {
          email: 'test@example.com',
          name: 'Test User',
        },
      }

      render(
        <SubmissionDetails
          submission={evaluatingSubmission}
          currentUserId="user-123"
        />
      )

      // Check that evaluating text is displayed
      expect(screen.getByText('Evaluating...')).toBeInTheDocument()
      expect(screen.getByText('EVALUATING')).toBeInTheDocument()
    })
  })

  describe('Error Message Variations', () => {
    it('should display quota error message', () => {
      const quotaError = 'API quota exceeded for gemini-2.5-pro. Please check your API key billing or wait before retrying.'
      const submission: SubmissionWithRelations = {
        id: 'sub-1',
        competitionId: 'comp-1',
        userId: 'user-123',
        prompt: 'Test prompt',
        status: 'FAILED',
        score: null,
        errorMessage: quotaError,
        evaluationLog: null,
        submittedAt: new Date(),
        evaluatedAt: null,
        competition: mockCompetition,
        user: {
          email: 'test@example.com',
          name: 'Test User',
        },
      }

      render(
        <SubmissionDetails submission={submission} currentUserId="user-123" />
      )

      expect(screen.getByText(quotaError)).toBeInTheDocument()
    })

    it('should display network error message', () => {
      const networkError = 'Network timeout'
      const submission: SubmissionWithRelations = {
        id: 'sub-1',
        competitionId: 'comp-1',
        userId: 'user-123',
        prompt: 'Test prompt',
        status: 'FAILED',
        score: null,
        errorMessage: networkError,
        evaluationLog: null,
        submittedAt: new Date(),
        evaluatedAt: null,
        competition: mockCompetition,
        user: {
          email: 'test@example.com',
          name: 'Test User',
        },
      }

      render(
        <SubmissionDetails submission={submission} currentUserId="user-123" />
      )

      expect(screen.getByText(networkError)).toBeInTheDocument()
    })

    it('should display evaluation failed message', () => {
      const evalError = 'Evaluation failed: LLM API error'
      const submission: SubmissionWithRelations = {
        id: 'sub-1',
        competitionId: 'comp-1',
        userId: 'user-123',
        prompt: 'Test prompt',
        status: 'FAILED',
        score: null,
        errorMessage: evalError,
        evaluationLog: null,
        submittedAt: new Date(),
        evaluatedAt: null,
        competition: mockCompetition,
        user: {
          email: 'test@example.com',
          name: 'Test User',
        },
      }

      render(
        <SubmissionDetails submission={submission} currentUserId="user-123" />
      )

      expect(screen.getByText(evalError)).toBeInTheDocument()
    })
  })
})
