"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/app/_components/navbar"
import { CompetitionsTable } from "./_components/competitions-table"

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCompetitions() {
      try {
        const response = await fetch("/api/competitions")
        if (response.ok) {
          const data = await response.json()
          setCompetitions(data)
        }
      } catch (error) {
        console.error("Failed to fetch competitions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCompetitions()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p>Loading competitions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Competitions</h1>
          <p className="text-xl text-muted-foreground">
            Browse and participate in prompt engineering competitions
          </p>
        </div>

        <CompetitionsTable competitions={competitions} />
      </div>
    </div>
  )
}
