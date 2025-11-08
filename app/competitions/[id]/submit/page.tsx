import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { SubmissionForm } from "@/components/submission-form"

export default async function SubmitPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  const competition = await prisma.competition.findUnique({
    where: { id: params.id },
    include: {
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

  // Check if competition is still active
  const isActive = new Date() < new Date(competition.endDate) && competition.status === "ACTIVE"

  if (!isActive) {
    redirect(`/competitions/${params.id}`)
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <SubmissionForm competition={competition} userId={session.user.id} />
      </div>
    </div>
  )
}
