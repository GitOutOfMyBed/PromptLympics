"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/app/_components/ui/card"
import { Trophy, Users, TrendingUp } from "lucide-react"

export function PracticeChallengesTable({
  practiceChallenges,
}: {
  practiceChallenges: any[]
}) {
  if (practiceChallenges.length === 0) {
    return (
      <Card className="py-16">
        <CardContent className="text-center">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">
            No practice challenges found. Check back later!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {practiceChallenges.map((challenge) => (
        <Link key={challenge.id} href={`/practice/${challenge.id}`}>
          <Card className="card-hover h-full border-2 bg-white/90 backdrop-blur-sm">
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{challenge._count.submissions}</span>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-xl mb-2 line-clamp-2 leading-tight">
                  {challenge.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {challenge.description}
                </p>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Trophy className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium">{challenge.organizationName}</span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                {challenge.bestScore !== null && (
                  <div className="flex items-center gap-1 text-sm font-semibold text-violet-600">
                    <TrendingUp className="h-4 w-4" />
                    <span>{(challenge.bestScore * 100).toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
