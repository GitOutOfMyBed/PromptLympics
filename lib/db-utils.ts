/**
 * SERVER-ONLY MODULE
 * Database utility functions
 */

import "server-only"

import { prisma } from "./prisma"

/**
 * Updates competitions from ACTIVE to COMPLETED if they've passed their end date.
 * Call this before fetching competitions to ensure database status is current.
 */
export async function updateExpiredCompetitions(): Promise<void> {
  await prisma.competition.updateMany({
    where: {
      status: "ACTIVE",
      endDate: {
        lt: new Date()
      }
    },
    data: {
      status: "COMPLETED"
    }
  })
}
