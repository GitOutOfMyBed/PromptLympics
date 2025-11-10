"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/_components/providers/auth-provider"
import { Navbar } from "@/app/_components/navbar"
import { SubmissionForm } from "./_components/submission-form"

export default function SubmitPage({
  params,
}: {
  params: { id: string }
}) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [competition, setCompetition] = useState<any>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin")
    }
  }, [user, loading, router])

  useEffect(() => {
    async function fetchCompetition() {
      try {
        const response = await fetch(`/api/competitions/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setCompetition(data)
        } else if (response.status === 404) {
          setNotFound(true)
        }
      } catch (error) {
        console.error("Failed to fetch competition:", error)
      } finally {
        setLoadingData(false)
      }
    }

    fetchCompetition()
  }, [params.id])

  if (loading || loadingData) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (notFound) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold">Competition not found</h1>
        </div>
      </div>
    )
  }

  // Check if competition is still active
  const isActive = competition && competition.status === "ACTIVE"

  if (!isActive) {
    router.push(`/competitions/${params.id}`)
    return null
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <SubmissionForm competition={competition} userId={user.uid} />
      </div>
    </div>
  )
}
