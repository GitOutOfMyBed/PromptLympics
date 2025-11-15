import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth(req);

    const practiceChallenge = await prisma.practiceChallenge.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        submissions: {
          take: 10,
          orderBy: {
            score: "desc",
          },
          select: {
            id: true,
            score: true,
            status: true,
            submittedAt: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!practiceChallenge) {
      return NextResponse.json(
        { error: "Practice challenge not found" },
        { status: 404 }
      );
    }

    // If user is authenticated, get their submission count and submissions for this practice challenge
    let userSubmissionCount = 0;
    let userSubmissions: any[] = [];
    if (auth?.user) {
      console.log('[Practice API] Fetching submissions for user:', auth.user.id, 'practice challenge:', params.id);

      userSubmissionCount = await prisma.practiceSubmission.count({
        where: {
          practiceChallengeId: params.id,
          userId: auth.user.id,
        },
      });

      userSubmissions = await prisma.practiceSubmission.findMany({
        where: {
          practiceChallengeId: params.id,
          userId: auth.user.id,
        },
        orderBy: {
          submittedAt: "desc",
        },
        select: {
          id: true,
          prompt: true,
          score: true,
          status: true,
          submittedAt: true,
          evaluatedAt: true,
        },
      });

      console.log('[Practice API] Found submissions:', userSubmissionCount, 'submissions:', userSubmissions.length);
    } else {
      console.log('[Practice API] No authenticated user found');
    }

    return NextResponse.json({
      ...practiceChallenge,
      userSubmissionCount,
      userSubmissions,
    });
  } catch (error) {
    console.error("Error fetching practice challenge:", error);
    return NextResponse.json(
      { error: "Failed to fetch practice challenge" },
      { status: 500 }
    );
  }
}

// NOTE: PATCH and DELETE endpoints are not exposed for practice challenges.
// Practice challenges are managed by platform administrators only.
// Use database tools or admin scripts to modify practice challenges.
