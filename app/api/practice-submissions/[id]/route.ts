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

    const submission = await prisma.practiceSubmission.findUnique({
      where: { id: params.id },
      include: {
        practiceChallenge: true,
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

    // Only allow user to view their own submission or practice challenge creator
    if (
      submission.userId !== auth.user.id &&
      submission.practiceChallenge.creatorId !== auth.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // For practice challenges, users can see their evaluation logs to learn from their mistakes
    // This is different from competitions where we hide validation data
    return NextResponse.json(submission)
  } catch (error) {
    console.error("Error fetching practice submission:", error)
    return NextResponse.json(
      { error: "Failed to fetch practice submission" },
      { status: 500 }
    )
  }
}
