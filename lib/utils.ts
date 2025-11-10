import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { prisma } from "./prisma"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

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
