/**
 * Shared Type Definitions
 * Exports Prisma types and defines additional types for forms and data structures.
 */

import type { Competition, Submission, User } from "@prisma/client"

// Re-export Prisma database types as source of truth
export type { Competition, Submission, User }

/**
 * TestCase structure for validation data JSON files.
 * Not stored in DB - loaded at runtime from Firebase Storage.
 */
export type TestCase = {
  input: string
  expectedOutput: string
}

/**
 * Competition creation form data.
 * Includes File objects for upload, converted to URLs before DB insert.
 */
export type CompetitionFormData = {
  title: string
  description: string
  organizationName: string
  modelType: string
  characterLimit: number | null
  tokenLimit: number | null
  examplePrompt: string
  totalPrize: number
  prizeDistribution: string
  firstPlacePrize: number | null
  secondPlacePrize: number | null
  thirdPlacePrize: number | null
  minimumScore: number | null
  targetScore: number | null
  maxSubmissionsPerUser: number
  startDate: string
  endDate: string
  trainingFile: File | null
  validationFile: File | null
  useOrganizerKey: boolean
  apiKey: string
}
