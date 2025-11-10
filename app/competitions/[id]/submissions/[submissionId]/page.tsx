"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/_components/providers/auth-provider"
import { Navbar } from "@/app/_components/navbar"
import { SubmissionDetails } from "./_components/submission-details"
import { authenticatedFetch } from "@/lib/api-client"

export default function SubmissionDetailPage({
  params,
}: {
  params: { id: string; submissionId: string }
}) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [submission, setSubmission] = useState<any>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin")
    }
  }, [user, loading, router])

  useEffect(() => {
    async function fetchSubmission() {
      if (!user) return

      try {
        const response = await authenticatedFetch(`/api/submissions/${params.submissionId}`)
        if (response.ok) {
          const data = await response.json()
          setSubmission(data)
        } else if (response.status === 404) {
          setNotFound(true)
        } else if (response.status === 403) {
          router.push("/competitions")
        }
      } catch (error) {
        console.error("Failed to fetch submission:", error)
      } finally {
        setLoadingData(false)
      }
    }

    fetchSubmission()
  }, [user, params.submissionId, router])

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
          <h1 className="text-2xl font-bold">Submission not found</h1>
        </div>
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p>Failed to load submission</p>
        </div>
      </div>
    )
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
