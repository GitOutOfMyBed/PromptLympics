import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { evaluatePrompt } from "@/lib/evaluation"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { competitionId, prompt } = await req.json()

    if (!competitionId || !prompt) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Get competition
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        testCases: true,
      },
    })

    if (!competition) {
      return NextResponse.json(
        { error: "Competition not found" },
        { status: 404 }
      )
    }

    // Check if competition is active
    if (
      competition.status !== "ACTIVE" ||
      new Date() > new Date(competition.endDate)
    ) {
      return NextResponse.json(
        { error: "Competition is not active" },
        { status: 400 }
      )
    }

    // Create submission
    const submission = await prisma.submission.create({
      data: {
        competitionId,
        userId: session.user.id,
        prompt,
        status: "PENDING",
      },
    })

    // Evaluate in background (in production, this should be a queue job)
    evaluatePrompt(submission.id, competition, prompt).catch(console.error)

    return NextResponse.json(submission, { status: 201 })
  } catch (error) {
    console.error("Error creating submission:", error)
    return NextResponse.json(
      { error: "Failed to create submission" },
      { status: 500 }
    )
  }
}
