import { NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth(req)

    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const submission = await prisma.submission.findUnique({
      where: { id: params.id },
      include: {
        competition: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      )
    }

    // Only allow user to view their own submission or competition organizer
    if (
      submission.userId !== auth.user.id &&
      submission.competition.organizerId !== auth.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Hide evaluation log from participants (protect validation dataset)
    // Organizers get full test case details, participants only see score
    const isOrganizer = submission.competition.organizerId === auth.user.id

    if (!isOrganizer) {
      return NextResponse.json({
        ...submission,
        evaluationLog: null, // Hide all test case details from participants
      })
    }

    return NextResponse.json(submission)
  } catch (error) {
    console.error("Error fetching submission:", error)
    return NextResponse.json(
      { error: "Failed to fetch submission" },
      { status: 500 }
    )
  }
}
