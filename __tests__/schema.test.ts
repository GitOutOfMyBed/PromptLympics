/**
 * Schema Validation Tests
 * Ensures Prisma schema matches the actual database schema
 * Catches schema drift before deployment
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Database Schema Validation', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should have customBaseUrl and customHeaders fields in Competition table', async () => {
    // This test will fail if the database migration hasn't been run
    // It forces us to keep the schema in sync

    try {
      // Try to query with the new fields
      const result = await prisma.competition.findFirst({
        select: {
          id: true,
          customBaseUrl: true,
          customHeaders: true,
        },
      });

      // If we get here without an error, the columns exist
      expect(true).toBe(true);
    } catch (error: any) {
      if (error.message?.includes('does not exist in the current database')) {
        fail(
          'Database schema is out of sync! Run migrations:\n' +
          '  npx prisma migrate deploy (production)\n' +
          '  npx prisma migrate dev (development)\n\n' +
          `Error: ${error.message}`
        );
      }
      throw error;
    }
  });

  it('should have customBaseUrl and customHeaders fields in PracticeChallenge table', async () => {
    try {
      const result = await prisma.practiceChallenge.findFirst({
        select: {
          id: true,
          customBaseUrl: true,
          customHeaders: true,
        },
      });

      expect(true).toBe(true);
    } catch (error: any) {
      if (error.message?.includes('does not exist in the current database')) {
        fail(
          'Database schema is out of sync! Run migrations:\n' +
          '  npx prisma migrate deploy (production)\n' +
          '  npx prisma migrate dev (development)\n\n' +
          `Error: ${error.message}`
        );
      }
      throw error;
    }
  });

  it('should allow null values for customBaseUrl and customHeaders', async () => {
    // These fields should be optional
    try {
      // Just query, don't create anything
      const competitions = await prisma.competition.findMany({
        where: {
          customBaseUrl: null,
        },
        take: 1,
      });

      const practices = await prisma.practiceChallenge.findMany({
        where: {
          customBaseUrl: null,
        },
        take: 1,
      });

      // If we get here, the query worked (fields are nullable)
      expect(true).toBe(true);
    } catch (error: any) {
      fail(`Fields should be nullable: ${error.message}`);
    }
  });

  it('should have all required Competition fields', async () => {
    // Ensures we don't accidentally remove required fields
    const requiredFields = [
      'id',
      'title',
      'description',
      'organizationName',
      'modelType',
      'encryptedApiKey',
      'apiKeyProvider',
      'trainingDataUrl',
      'validationDataUrl',
      'customBaseUrl',  // Added in this PR
      'customHeaders',  // Added in this PR
    ];

    try {
      await prisma.competition.findFirst({
        select: Object.fromEntries(
          requiredFields.map(field => [field, true])
        ),
      });
      expect(true).toBe(true);
    } catch (error: any) {
      fail(`Missing required field in Competition table: ${error.message}`);
    }
  });

  it('should have all required PracticeChallenge fields', async () => {
    const requiredFields = [
      'id',
      'title',
      'description',
      'organizationName',
      'modelType',
      'encryptedApiKey',
      'apiKeyProvider',
      'trainingDataUrl',
      'validationDataUrl',
      'customBaseUrl',  // Added in this PR
      'customHeaders',  // Added in this PR
    ];

    try {
      await prisma.practiceChallenge.findFirst({
        select: Object.fromEntries(
          requiredFields.map(field => [field, true])
        ),
      });
      expect(true).toBe(true);
    } catch (error: any) {
      fail(`Missing required field in PracticeChallenge table: ${error.message}`);
    }
  });
});
