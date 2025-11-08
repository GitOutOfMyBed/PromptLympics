import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Navbar } from "@/components/navbar"
import { CompetitionsTable } from "@/components/competitions-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function CompetitionsPage() {
  const session = await getServerSession(authOptions)

  const competitions = await prisma.competition.findMany({
    where: {
      status: {
        in: ["ACTIVE", "COMPLETED"],
      },
    },
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

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Competitions</h1>
            <p className="text-muted-foreground mt-2">
              Browse and participate in prompt engineering competitions
            </p>
          </div>
          {session && (
            <Link href="/competitions/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Competition
              </Button>
            </Link>
          )}
        </div>

        <CompetitionsTable competitions={competitions} />
      </div>
    </div>
  )
}
