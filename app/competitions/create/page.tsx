import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { CompetitionCreateForm } from "@/components/competition-create-form"

export default async function CreateCompetitionPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <CompetitionCreateForm userId={session.user.id} />
      </div>
    </div>
  )
}
