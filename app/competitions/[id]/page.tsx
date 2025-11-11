"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/app/_components/providers/auth-provider"
import { Navbar } from "@/app/_components/navbar"
import { CompetitionDetails } from "./_components/competition-details"

export default function CompetitionPage({
  params,
}: {
  params: { id: string }
}) {
  const { user } = useAuth()
  const [competition, setCompetition] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const fetchCompetition = useCallback(async () => {
    setLoading(true)
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      // Add auth token if user is logged in
      if (user) {
        const token = await user.getIdToken()
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`/api/competitions/${params.id}`, {
        cache: 'no-store',
        headers,
      })
      if (response.ok) {
        const data = await response.json()
        console.log('[Competition Page] Received data:', {
          userSubmissionCount: data.userSubmissionCount,
          userSubmissionsLength: data.userSubmissions?.length,
          maxSubmissions: data.maxSubmissionsPerUser
        })
        setCompetition(data)
      } else if (response.status === 404) {
        setNotFound(true)
      }
    } catch (error) {
      console.error("Failed to fetch competition:", error)
    } finally {
      setLoading(false)
    }
  }, [params.id, user])

  useEffect(() => {
    fetchCompetition()
  }, [params.id, user, fetchCompetition])

  // Refetch when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      fetchCompetition()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [fetchCompetition])

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
