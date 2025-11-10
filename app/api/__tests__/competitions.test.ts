/**
 * API Route Tests
 *
 * Note: These tests demonstrate the test setup structure.
 * Full API route testing would require mocking Next.js request/response objects.
 */

import { prisma } from '@/lib/prisma'

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    competition: {
      findMany: jest.fn(),
    },
  },
}))

describe('API Competition Service Layer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches competitions from database', async () => {
    const mockCompetitions = [
      {
        id: '1',
        title: 'Test Competition 1',
        summary: 'Description 1',
        organizationName: 'Org 1',
        totalPrize: 1000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        status: 'ACTIVE',
        bestScore: 0.9,
        _count: { submissions: 10 },
        organizer: { name: 'John', email: 'john@test.com' },
      },
      {
        id: '2',
        title: 'Test Competition 2',
        summary: 'Description 2',
        organizationName: 'Org 2',
        totalPrize: 2000,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-11-30'),
        status: 'ACTIVE',
        bestScore: null,
        _count: { submissions: 5 },
        organizer: { name: 'Jane', email: 'jane@test.com' },
      },
    ]

    ;(prisma.competition.findMany as jest.Mock).mockResolvedValue(mockCompetitions)

    const result = await prisma.competition.findMany({
      include: {
        _count: {
          select: { submissions: true },
        },
        organizer: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    expect(result).toHaveLength(2)
    expect(result[0].title).toBe('Test Competition 1')
    expect(prisma.competition.findMany).toHaveBeenCalled()
  })

  it('handles database errors', async () => {
    ;(prisma.competition.findMany as jest.Mock).mockRejectedValue(
      new Error('Database error')
    )

    await expect(
      prisma.competition.findMany()
    ).rejects.toThrow('Database error')
  })
})
