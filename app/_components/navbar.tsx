"use client"

import Link from "next/link"
import { signOut } from "firebase/auth"
import { auth } from "@/firebase/firebasefrontend"
import { useAuth } from "@/app/_components/providers/auth-provider"
import { Button } from "@/app/_components/ui/button"
import { Trophy, Plus } from "lucide-react"

export function Navbar() {
  const { user } = useAuth()

  const handleSignOut = async () => {
    await signOut(auth)
  }

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <Trophy className="h-6 w-6" />
          PromptLympics
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/competitions">
                <Button variant="ghost">Competitions</Button>
              </Link>
              <Link href="/profile">
                <Button variant="ghost">Profile</Button>
              </Link>
              <Link href="/competitions/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Competition
                </Button>
              </Link>
              <Button onClick={handleSignOut} variant="outline">
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/signin">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
