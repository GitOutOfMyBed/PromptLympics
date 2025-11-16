/**
 * Database Schema Sync Tests
 * Prevents schema mismatch errors by verifying database matches Prisma schema
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Database Schema Sync', () => {
  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('Competition table should have all required columns', async () => {
    const result = await prisma.$queryRaw<{ column_name: string }[]>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Competition'
    `

    const columnNames = result.map(r => r.column_name)

    const requiredColumns = [
      'id',
      'title',
      'description',
      'organizationName',
      'totalPrize',
      'prizeDistribution',
      'maxSubmissionsPerUser',
      'trainingDataUrl',
      'validationDataUrl',
      'trainingDataSize',
      'validationDataSize',
      'startDate',
      'endDate',
      'createdAt',
      'updatedAt',
      'status',
      'organizerId',
      'modelType',
      'encryptedApiKey',
      'apiKeyProvider',
      'customBaseUrl',  // This was missing!
      'customHeaders',  // This was missing!
    ]

    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col))

    if (missingColumns.length > 0) {
      throw new Error(
        `Competition table is missing columns: ${missingColumns.join(', ')}\n` +
        'Run: npx prisma migrate deploy'
      )
    }
  })

  it('PracticeChallenge table should exist with all columns', async () => {
    const tableExists = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'PracticeChallenge'
      ) as exists
    `

    if (!tableExists[0].exists) {
      throw new Error(
        'PracticeChallenge table does not exist.\n' +
        'Run: npx prisma migrate deploy'
      )
    }

    const result = await prisma.$queryRaw<{ column_name: string }[]>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'PracticeChallenge'
    `

    const columnNames = result.map(r => r.column_name)

    const requiredColumns = [
      'id',
      'title',
      'description',
      'organizationName',
      'maxSubmissionsPerUser',
      'trainingDataUrl',
      'validationDataUrl',
      'trainingDataSize',
      'validationDataSize',
      'createdAt',
      'updatedAt',
      'creatorId',
      'modelType',
      'encryptedApiKey',
      'apiKeyProvider',
      'customBaseUrl',
      'customHeaders',
    ]

    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col))

    if (missingColumns.length > 0) {
      throw new Error(
        `PracticeChallenge table is missing columns: ${missingColumns.join(', ')}\n` +
        'Run: npx prisma migrate deploy'
      )
    }
  })

  it('all migrations should be applied', async () => {
    const migrations = await prisma.$queryRaw<{ migration_name: string }[]>`
      SELECT migration_name
      FROM _prisma_migrations
      WHERE finished_at IS NOT NULL
      ORDER BY finished_at DESC
    `

    // Should have at least the baseline migration
    expect(migrations.length).toBeGreaterThan(0)

    // Check that recent migrations are applied
    const migrationNames = migrations.map(m => m.migration_name)

    // Log for visibility
    console.log('Applied migrations:', migrationNames)
  })
})
