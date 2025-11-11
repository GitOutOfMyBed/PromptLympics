"use client"

import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { Badge } from "@/app/_components/ui/badge"
import { Card, CardContent, CardHeader } from "@/app/_components/ui/card"
import { Trophy, Users, Calendar, TrendingUp } from "lucide-react"
import type { Competition } from "@/lib/types"

export function CompetitionsTable({
  competitions,
}: {
  competitions: (Competition & {
    _count: { submissions: number }
    organizer: { name: string | null; email: string }
  })[]
}) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default"
      case "COMPLETED":
        return "secondary"
      case "CANCELLED":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "Active"
      case "COMPLETED":
        return "Ended"
      case "CANCELLED":
        return "Cancelled"
      default:
        return status
    }
  }

  if (competitions.length === 0) {
    return (
      <Card className="py-16">
        <CardContent className="text-center">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">
            No competitions found. Be the first to create one!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {competitions.map((competition) => (
        <Link key={competition.id} href={`/competitions/${competition.id}`}>
          <Card className="card-hover h-full border-2 bg-white/90 backdrop-blur-sm">
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <Badge variant={getStatusVariant(competition.status)} className="font-semibold">
                  {getStatusLabel(competition.status)}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{competition._count.submissions}</span>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-xl mb-2 line-clamp-2 leading-tight">
                  {competition.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {competition.description}
                </p>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Trophy className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium">{competition.organizationName}</span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{formatDate(competition.endDate)}</span>
                </div>
                {competition.bestScore !== null && (
                  <div className="flex items-center gap-1 text-sm font-semibold text-violet-600">
                    <TrendingUp className="h-4 w-4" />
                    <span>{(competition.bestScore * 100).toFixed(1)}%</span>
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
