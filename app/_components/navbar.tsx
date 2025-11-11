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
    <nav className="border-b border-cyan-100/50 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold hover-lift group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-sm">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <span className="gradient-text">PromptLympics</span>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/competitions">
                <Button variant="ghost" className="font-medium">Competitions</Button>
              </Link>
              <Link href="/profile">
                <Button variant="ghost" className="font-medium">Profile</Button>
              </Link>
              <Link href="/competitions/create">
                <Button className="font-medium hover-lift">
                  <Plus className="h-4 w-4 mr-2" />
                  Create
                </Button>
              </Link>
              <Button onClick={handleSignOut} variant="outline" className="font-medium">
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/signin">
                <Button variant="ghost" className="font-medium">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="font-medium hover-lift">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
