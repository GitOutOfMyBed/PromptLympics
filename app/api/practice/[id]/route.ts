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

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth(req);

    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const practiceChallenge = await prisma.practiceChallenge.findUnique({
      where: { id: params.id },
    });

    if (!practiceChallenge) {
      return NextResponse.json(
        { error: "Practice challenge not found" },
        { status: 404 }
      );
    }

    if (practiceChallenge.creatorId !== auth.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();

    const updated = await prisma.practiceChallenge.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating practice challenge:", error);
    return NextResponse.json(
      { error: "Failed to update practice challenge" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth(req);

    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const practiceChallenge = await prisma.practiceChallenge.findUnique({
      where: { id: params.id },
    });

    if (!practiceChallenge) {
      return NextResponse.json(
        { error: "Practice challenge not found" },
        { status: 404 }
      );
    }

    if (practiceChallenge.creatorId !== auth.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.practiceChallenge.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Practice challenge deleted" });
  } catch (error) {
    console.error("Error deleting practice challenge:", error);
    return NextResponse.json(
      { error: "Failed to delete practice challenge" },
      { status: 500 }
    );
  }
}
