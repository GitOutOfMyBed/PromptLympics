"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { LandingPage } from "@/components/landing-page"

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push("/competitions")
    }
  }, [user, loading, router])

  if (loading) {
    return <div>Loading...</div>
  }

  return <LandingPage />
}
