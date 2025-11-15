"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/app/_components/navbar"
import { PracticeChallengesTable } from "./_components/practice-challenges-table"

export default function PracticePage() {
  const [practiceChallenges, setPracticeChallenges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPracticeChallenges() {
      try {
        const response = await fetch("/api/practice")
        if (response.ok) {
          const data = await response.json()
          setPracticeChallenges(data)
        }
      } catch (error) {
        console.error("Failed to fetch practice challenges:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPracticeChallenges()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p>Loading practice challenges...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Practice Challenges</h1>
          <p className="text-xl text-muted-foreground">
            Practice your prompt engineering skills with these challenges
          </p>
        </div>

        <PracticeChallengesTable practiceChallenges={practiceChallenges} />
      </div>
    </div>
  )
}
