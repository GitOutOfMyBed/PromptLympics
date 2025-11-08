"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Navbar } from "@/components/navbar"
import { CompetitionsTable } from "@/components/competitions-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default function CompetitionsPage() {
  const { user } = useAuth()
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Competitions</h1>
            <p className="text-muted-foreground mt-2">
              Browse and participate in prompt engineering competitions
            </p>
          </div>
          {user && (
            <Link href="/competitions/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Competition
              </Button>
            </Link>
          )}
        </div>

        <CompetitionsTable competitions={competitions} />
      </div>
    </div>
  )
}
