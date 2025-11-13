import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/practice
 * Returns all practice challenges with submission counts and creator info.
 * Practice challenges are created by platform admins, not by regular users.
 */
export async function GET(req: Request) {
  try {
    const practiceChallenges = await prisma.practiceChallenge.findMany({
      include: {
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(practiceChallenges);
  } catch (error) {
    console.error("Error fetching practice challenges:", error);
    return NextResponse.json(
      { error: "Failed to fetch practice challenges" },
      { status: 500 }
    );
  }
}

// NOTE: Practice challenges are created by platform administrators only.
// To add practice challenges, use a database seed script or admin tool.
// See prisma/seed-practice.ts for examples.
