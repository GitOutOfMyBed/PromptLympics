import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Navbar } from "@/components/navbar"
import { UserProfile } from "@/components/user-profile"

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
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
    redirect("/auth/signin")
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <UserProfile user={user} />
      </div>
    </div>
  )
}
