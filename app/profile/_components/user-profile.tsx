"use client"

import Link from "next/link"
import { formatDate, formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/_components/ui/table"
import { Badge } from "@/app/_components/ui/badge"
import { Button } from "@/app/_components/ui/button"
import { Trophy, FileText, Plus } from "lucide-react"

type UserProfileProps = {
  user: any
}

export function UserProfile({ user }: UserProfileProps) {
  const totalSubmissions = user.submissions.length
  const completedCompetitions = user.competitions.filter(
    (c: any) => c.status === "COMPLETED"
  ).length

  // Calculate best scores and rankings
  const submissionsWithRank = user.submissions.map((submission: any) => {
    return {
      ...submission,
      rank: submission.score !== null ? getRank(submission) : null,
    }
  })

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{user.name || "User"}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <Link href="/competitions/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Competition
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubmissions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Competitions Created</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.competitions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCompetitions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="submissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="submissions">My Submissions</TabsTrigger>
          <TabsTrigger value="created">Created Competitions</TabsTrigger>
        </TabsList>

        <TabsContent value="submissions">
          <Card>
            <CardHeader>
              <CardTitle>Submission History</CardTitle>
              <CardDescription>
                View all your competition submissions and results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Competition</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissionsWithRank.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No submissions yet. Start participating in competitions!
                      </TableCell>
                    </TableRow>
                  ) : (
                    submissionsWithRank.map((submission: any) => (
                      <TableRow key={submission.id}>
                        <TableCell>
                          <Link
                            href={`/competitions/${submission.competitionId}`}
                            className="hover:underline"
                          >
                            {submission.competition.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {submission.score !== null ? (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {(submission.score * 100).toFixed(1)}%
                              </span>
                              {submission.rank === 1 && (
                                <Trophy className="h-4 w-4 text-yellow-500" />
                              )}
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              submission.status === "COMPLETED"
                                ? "default"
                                : submission.status === "FAILED"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {submission.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(submission.submittedAt)}</TableCell>
                        <TableCell>
                          <Link href={`/competitions/${submission.competitionId}/submissions/${submission.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="created">
          <Card>
            <CardHeader>
              <CardTitle>Your Competitions</CardTitle>
              <CardDescription>
                Manage competitions you&apos;ve created
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Prize</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submissions</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.competitions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No competitions created yet.{" "}
                        <Link href="/competitions/create" className="text-primary hover:underline">
                          Create your first competition
                        </Link>
                      </TableCell>
                    </TableRow>
                  ) : (
                    user.competitions.map((competition: any) => (
                      <TableRow key={competition.id}>
                        <TableCell>
                          <Link
                            href={`/competitions/${competition.id}`}
                            className="hover:underline"
                          >
                            {competition.title}
                          </Link>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(competition.totalPrize)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              competition.status === "ACTIVE"
                                ? "default"
                                : competition.status === "COMPLETED"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {competition.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{competition._count.submissions}</TableCell>
                        <TableCell>{formatDate(competition.endDate)}</TableCell>
                        <TableCell>
                          <Link href={`/competitions/${competition.id}`}>
                            <Button variant="ghost" size="sm">
                              Manage
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper function to calculate rank (simplified - would need actual leaderboard data)
function getRank(submission: any): number {
  // This is a placeholder - in real implementation, you'd query all submissions
  // for the competition and calculate the actual rank
  return 1
}
