import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")

    const where = status ? { status } : {}

    const competitions = await prisma.competition.findMany({
      where,
      include: {
        organizer: {
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
    })

    return NextResponse.json(competitions)
  } catch (error) {
    console.error("Error fetching competitions:", error)
    return NextResponse.json(
      { error: "Failed to fetch competitions" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()

    // Validate required fields
    if (!data.title || !data.description || !data.organizationName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Create competition
    const competition = await prisma.competition.create({
      data: {
        title: data.title,
        summary: data.summary,
        description: data.description,
        organizationName: data.organizationName,
        totalPrize: data.totalPrize,
        firstPlacePrize: data.firstPlacePrize,
        secondPlacePrize: data.secondPlacePrize,
        thirdPlacePrize: data.thirdPlacePrize,
        prizeDistribution: data.prizeDistribution,
        minimumScore: data.minimumScore,
        targetScore: data.targetScore,
        examplePrompt: data.examplePrompt,
        characterLimit: data.characterLimit,
        tokenLimit: data.tokenLimit,
        modelType: data.modelType,
        trainingDataUrl: data.trainingDataUrl,
        validationDataUrl: data.validationDataUrl,
        trainingDataSize: data.trainingDataSize,
        validationDataSize: data.validationDataSize,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        organizerId: session.user.id,
        status: "ACTIVE",
      },
    })

    return NextResponse.json(competition, { status: 201 })
  } catch (error) {
    console.error("Error creating competition:", error)
    return NextResponse.json(
      { error: "Failed to create competition" },
      { status: 500 }
    )
  }
}
