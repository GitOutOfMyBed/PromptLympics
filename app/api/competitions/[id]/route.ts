import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth(req);

    const competition = await prisma.competition.findUnique({
      where: { id: params.id },
      include: {
        organizer: {
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
          include: {
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

    if (!competition) {
      return NextResponse.json(
        { error: "Competition not found" },
        { status: 404 }
      );
    }

    // If user is authenticated, get their submission count for this competition
    let userSubmissionCount = 0;
    if (auth?.user) {
      userSubmissionCount = await prisma.submission.count({
        where: {
          competitionId: params.id,
          userId: auth.user.id,
        },
      });
    }

    return NextResponse.json({
      ...competition,
      userSubmissionCount,
    });
  } catch (error) {
    console.error("Error fetching competition:", error);
    return NextResponse.json(
      { error: "Failed to fetch competition" },
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

    const competition = await prisma.competition.findUnique({
      where: { id: params.id },
    });

    if (!competition) {
      return NextResponse.json(
        { error: "Competition not found" },
        { status: 404 }
      );
    }

    if (competition.organizerId !== auth.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();

    const updated = await prisma.competition.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating competition:", error);
    return NextResponse.json(
      { error: "Failed to update competition" },
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

    const competition = await prisma.competition.findUnique({
      where: { id: params.id },
    });

    if (!competition) {
      return NextResponse.json(
        { error: "Competition not found" },
        { status: 404 }
      );
    }

    if (competition.organizerId !== auth.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.competition.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Competition deleted" });
  } catch (error) {
    console.error("Error deleting competition:", error);
    return NextResponse.json(
      { error: "Failed to delete competition" },
      { status: 500 }
    );
  }
}
