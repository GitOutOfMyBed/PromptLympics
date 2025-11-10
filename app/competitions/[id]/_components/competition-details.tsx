"use client"

import { useState } from "react"
import Link from "next/link"
import { formatDate, formatCurrency } from "@/lib/utils"
import { Button } from "@/app/_components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card"
import { Badge } from "@/app/_components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/_components/ui/table"
import { Trophy, Calendar, DollarSign, Target, Download, Code } from "lucide-react"
import type { User } from "firebase/auth"

type CompetitionDetailsProps = {
  competition: any
  session: { user: User } | null
}

export function CompetitionDetails({ competition, session }: CompetitionDetailsProps) {
  const isActive = new Date() < new Date(competition.endDate) && competition.status === "ACTIVE"
  const isOrganizer = session?.user?.uid === competition.organizerId

  const downloadTestCases = () => {
    // This would trigger a download of the training test cases
    window.location.href = competition.trainingDataUrl
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">{competition.title}</h1>
          <p className="text-muted-foreground">{competition.summary}</p>
        </div>
        {isActive && session && !isOrganizer && (
          <Link href={`/competitions/${competition.id}/submit`}>
            <Button size="lg">
              <Code className="h-4 w-4 mr-2" />
              Submit Prompt
            </Button>
          </Link>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prize Pool</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(competition.totalPrize)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Score</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {competition.bestScore !== null
                ? `${(competition.bestScore * 100).toFixed(1)}%`
                : "No submissions"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "Active" : "Ended"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deadline</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDate(competition.endDate)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="data">Data & Test Cases</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="whitespace-pre-wrap">{competition.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Competition Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-1">Organization</h4>
                  <p className="text-muted-foreground">{competition.organizationName}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Model</h4>
                  <p className="text-muted-foreground">{competition.modelType}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Start Date</h4>
                  <p className="text-muted-foreground">{formatDate(competition.startDate)}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">End Date</h4>
                  <p className="text-muted-foreground">{formatDate(competition.endDate)}</p>
                </div>
              </div>

              {competition.characterLimit && (
                <div>
                  <h4 className="font-semibold mb-1">Character Limit</h4>
                  <p className="text-muted-foreground">{competition.characterLimit} characters</p>
                </div>
              )}

              {competition.tokenLimit && (
                <div>
                  <h4 className="font-semibold mb-1">Token Limit</h4>
                  <p className="text-muted-foreground">{competition.tokenLimit} tokens</p>
                </div>
              )}
            </CardContent>
          </Card>

          {competition.examplePrompt && (
            <Card>
              <CardHeader>
                <CardTitle>Example Prompt</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="p-4 bg-muted rounded-md overflow-x-auto">
                  <code>{competition.examplePrompt}</code>
                </pre>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Prize Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {competition.firstPlacePrize && (
                  <div className="flex justify-between">
                    <span>1st Place</span>
                    <span className="font-semibold">{formatCurrency(competition.firstPlacePrize)}</span>
                  </div>
                )}
                {competition.secondPlacePrize && (
                  <div className="flex justify-between">
                    <span>2nd Place</span>
                    <span className="font-semibold">{formatCurrency(competition.secondPlacePrize)}</span>
                  </div>
                )}
                {competition.thirdPlacePrize && (
                  <div className="flex justify-between">
                    <span>3rd Place</span>
                    <span className="font-semibold">{formatCurrency(competition.thirdPlacePrize)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle>Top Submissions</CardTitle>
              <CardDescription>
                Current leaderboard rankings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Participant</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {competition.submissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No submissions yet. Be the first!
                      </TableCell>
                    </TableRow>
                  ) : (
                    competition.submissions.map((submission: any, index: number) => (
                      <TableRow key={submission.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {index === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                            #{index + 1}
                          </div>
                        </TableCell>
                        <TableCell>{submission.user.name || submission.user.email}</TableCell>
                        <TableCell>
                          {submission.score !== null
                            ? `${(submission.score * 100).toFixed(1)}%`
                            : "Pending"}
                        </TableCell>
                        <TableCell>{formatDate(submission.submittedAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Test Cases & Data</CardTitle>
              <CardDescription>
                Download training data and view sample test cases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Button onClick={downloadTestCases}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Training Data ({competition.trainingDataSize} samples)
                </Button>
              </div>

              {competition.testCases.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Sample Test Cases</h4>
                  <div className="space-y-4">
                    {competition.testCases.map((testCase: any) => (
                      <Card key={testCase.id}>
                        <CardContent className="pt-6">
                          <div className="space-y-2">
                            <div>
                              <span className="font-semibold">Input:</span>
                              <pre className="mt-1 p-2 bg-muted rounded text-sm overflow-x-auto">
                                {testCase.input}
                              </pre>
                            </div>
                            <div>
                              <span className="font-semibold">Expected Output:</span>
                              <pre className="mt-1 p-2 bg-muted rounded text-sm overflow-x-auto">
                                {testCase.expectedOutput}
                              </pre>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
