import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { SubmissionDetails } from "@/components/submission-details"

export default async function SubmissionDetailPage({
  params,
}: {
  params: { id: string; submissionId: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  const submission = await prisma.submission.findUnique({
    where: { id: params.submissionId },
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
    notFound()
  }

  // Check authorization
  if (
    submission.userId !== session.user.id &&
    submission.competition.organizerId !== session.user.id
  ) {
    redirect("/competitions")
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <SubmissionDetails submission={submission} />
      </div>
    </div>
  )
}
