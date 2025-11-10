"use client"

import Link from "next/link"
import { formatDate, formatCurrency } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/_components/ui/table"
import { Badge } from "@/app/_components/ui/badge"
import { Card } from "@/app/_components/ui/card"

type Competition = {
  id: string
  title: string
  summary: string
  organizationName: string
  totalPrize: number
  startDate: Date
  endDate: Date
  status: string
  bestScore: number | null
  _count: {
    submissions: number
  }
  organizer: {
    name: string | null
    email: string
  }
}

export function CompetitionsTable({
  competitions,
}: {
  competitions: Competition[]
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

  const isActive = (endDate: Date) => {
    return new Date() < new Date(endDate)
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Competition</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Prize</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Best Score</TableHead>
            <TableHead>Submissions</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {competitions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                No competitions found. Be the first to create one!
              </TableCell>
            </TableRow>
          ) : (
            competitions.map((competition) => (
              <TableRow key={competition.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <Link
                    href={`/competitions/${competition.id}`}
                    className="hover:underline"
                  >
                    <div>
                      <div className="font-medium">{competition.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {competition.summary}
                      </div>
                    </div>
                  </Link>
                </TableCell>
                <TableCell>{competition.organizationName}</TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(competition.totalPrize)}
                </TableCell>
                <TableCell>{formatDate(competition.startDate)}</TableCell>
                <TableCell>{formatDate(competition.endDate)}</TableCell>
                <TableCell>
                  {competition.bestScore !== null
                    ? `${(competition.bestScore * 100).toFixed(1)}%`
                    : "-"}
                </TableCell>
                <TableCell>{competition._count.submissions}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(competition.status)}>
                    {isActive(competition.endDate) && competition.status === "ACTIVE"
                      ? "Active"
                      : competition.status === "COMPLETED"
                      ? "Ended"
                      : competition.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  )
}
