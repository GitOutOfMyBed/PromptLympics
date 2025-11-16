import { NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const auth = await verifyAuth(req)

    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      include: {
        submissions: {
          include: {
            competition: {
              select: {
                id: true,
                title: true,
                status: true,
                endDate: true,
              },
            },
          },
          orderBy: {
            submittedAt: "desc",
          },
        },
        competitions: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            _count: {
              select: {
                submissions: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    )
  }
}
