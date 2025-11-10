import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { evaluatePrompt } from "@/lib/evaluation";
import { updateExpiredCompetitions } from "@/lib/utils";

/**
 * POST /api/submissions
 * Creates a new prompt submission for a competition and triggers evaluation.
 * Validates user auth, competition status, and submission limits.
 */
export async function POST(req: Request) {
  try {
    const auth = await verifyAuth(req);

    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { competitionId, prompt } = await req.json();

    if (!competitionId || !prompt) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update expired competitions before checking status
    await updateExpiredCompetitions();

    // Get competition
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
    });

    if (!competition) {
      return NextResponse.json(
        { error: "Competition not found" },
        { status: 404 }
      );
    }

    // Check if competition is active (status is now kept up-to-date by updateExpiredCompetitions)
    if (competition.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Competition is not active" },
        { status: 400 }
      );
    }

    // Check submission limit
    const userSubmissionCount = await prisma.submission.count({
      where: {
        competitionId,
        userId: auth.user.id,
      },
    });

    if (userSubmissionCount >= competition.maxSubmissionsPerUser) {
      return NextResponse.json(
        {
          error: `You have reached the maximum of ${competition.maxSubmissionsPerUser} submissions for this competition`,
        },
        { status: 400 }
      );
    }

    // Create submission
    const submission = await prisma.submission.create({
      data: {
        competitionId,
        userId: auth.user.id,
        prompt,
        status: "PENDING",
      },
    });

    // Evaluate in background (in production, this should be a queue job)
    evaluatePrompt(submission.id, competition, prompt).catch(console.error);

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error("Error creating submission:", error);
    return NextResponse.json(
      { error: "Failed to create submission" },
      { status: 500 }
    );
  }
}
