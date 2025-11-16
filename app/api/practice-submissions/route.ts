import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { evaluatePracticePrompt } from "@/lib/practice-evaluation";

export const dynamic = 'force-dynamic'

/**
 * POST /api/practice-submissions
 * Creates a new prompt submission for a practice challenge and triggers evaluation.
 * Validates user auth and submission limits.
 */
export async function POST(req: Request) {
  try {
    const auth = await verifyAuth(req);

    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { practiceChallengeId, prompt } = await req.json();

    if (!practiceChallengeId || !prompt) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get practice challenge
    const practiceChallenge = await prisma.practiceChallenge.findUnique({
      where: { id: practiceChallengeId },
    });

    if (!practiceChallenge) {
      return NextResponse.json(
        { error: "Practice challenge not found" },
        { status: 404 }
      );
    }

    // Check submission limit
    const userSubmissionCount = await prisma.practiceSubmission.count({
      where: {
        practiceChallengeId,
        userId: auth.user.id,
      },
    });

    if (userSubmissionCount >= practiceChallenge.maxSubmissionsPerUser) {
      return NextResponse.json(
        {
          error: `You have reached the maximum of ${practiceChallenge.maxSubmissionsPerUser} submissions for this practice challenge`,
        },
        { status: 400 }
      );
    }

    // Create submission
    console.log('[Practice Submissions API] Creating submission for user:', auth.user.id, 'practice challenge:', practiceChallengeId);

    const submission = await prisma.practiceSubmission.create({
      data: {
        practiceChallengeId,
        userId: auth.user.id,
        prompt,
        status: "PENDING",
      },
    });

    console.log('[Practice Submissions API] Created submission:', submission.id);

    // Evaluate in background (in production, this should be a queue job)
    evaluatePracticePrompt(submission.id, practiceChallenge, prompt).catch(console.error);

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error("Error creating practice submission:", error);
    return NextResponse.json(
      { error: "Failed to create practice submission" },
      { status: 500 }
    );
  }
}
