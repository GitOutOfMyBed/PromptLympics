"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/_components/providers/auth-provider"
import { Navbar } from "@/app/_components/navbar"
import { PracticeSubmissionForm } from "./_components/practice-submission-form"

export default function PracticeSubmitPage({
  params,
}: {
  params: { id: string }
}) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [practiceChallenge, setPracticeChallenge] = useState<any>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin")
    }
  }, [user, loading, router])

  useEffect(() => {
    async function fetchPracticeChallenge() {
      try {
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        }

        // Add auth token if user is logged in
        if (user) {
          const token = await user.getIdToken()
          headers['Authorization'] = `Bearer ${token}`
        }

        const response = await fetch(`/api/practice/${params.id}`, {
          headers,
        })
        if (response.ok) {
          const data = await response.json()
          setPracticeChallenge(data)
        } else if (response.status === 404) {
          setNotFound(true)
        }
      } catch (error) {
        console.error("Failed to fetch practice challenge:", error)
      } finally {
        setLoadingData(false)
      }
    }

    fetchPracticeChallenge()
  }, [params.id, user])

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
          <h1 className="text-2xl font-bold">Practice challenge not found</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <PracticeSubmissionForm practiceChallenge={practiceChallenge} userId={user.uid} />
      </div>
    </div>
  )
}
