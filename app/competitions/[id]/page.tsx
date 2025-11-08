"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Navbar } from "@/components/navbar"
import { CompetitionDetails } from "@/components/competition-details"

export default function CompetitionPage({
  params,
}: {
  params: { id: string }
}) {
  const { user } = useAuth()
  const [competition, setCompetition] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

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
        setLoading(false)
      }
    }

    fetchCompetition()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p>Loading...</p>
        </div>
      </div>
    )
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

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <CompetitionDetails competition={competition} session={user ? { user } : null} />
      </div>
    </div>
  )
}
