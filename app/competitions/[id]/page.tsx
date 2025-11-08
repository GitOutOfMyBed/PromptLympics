import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { CompetitionDetails } from "@/components/competition-details"

export default async function CompetitionPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

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
      testCases: {
        where: {
          isPublic: true,
        },
      },
    },
  })

  if (!competition) {
    notFound()
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <CompetitionDetails competition={competition} session={session} />
      </div>
    </div>
  )
}
