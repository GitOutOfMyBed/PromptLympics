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
import { Trophy, Calendar, DollarSign, Target, Download, Code, FileText } from "lucide-react"
import type { User } from "firebase/auth"

type PracticeChallengeDetailsProps = {
  practiceChallenge: any
  session: { user: User } | null
}

export function PracticeChallengeDetails({ practiceChallenge, session }: PracticeChallengeDetailsProps) {
  const isCreator = session?.user?.uid === practiceChallenge.creatorId
  const userSubmissionCount = practiceChallenge.userSubmissionCount || 0
  const submissionsRemaining = practiceChallenge.maxSubmissionsPerUser - userSubmissionCount
  const canSubmit = session && !isCreator && submissionsRemaining > 0

  const downloadTestCases = () => {
    // This would trigger a download of the training test cases
    window.location.href = practiceChallenge.trainingDataUrl
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold">{practiceChallenge.title}</h1>
          <Badge variant="outline" className="mt-2">Practice Challenge</Badge>
        </div>
        {session && !isCreator && (
          <div className="flex flex-col items-end gap-2">
            {canSubmit ? (
              <>
                <Link href={`/practice/${practiceChallenge.id}/submit`}>
                  <Button size="lg">
                    <Code className="h-4 w-4 mr-2" />
                    Submit Prompt
                  </Button>
                </Link>
                <p className="text-sm text-muted-foreground">
                  {submissionsRemaining} submission{submissionsRemaining !== 1 ? 's' : ''} remaining
                </p>
              </>
            ) : (
              <>
                <Button size="lg" disabled>
                  <Code className="h-4 w-4 mr-2" />
                  No Submissions Left
                </Button>
                <p className="text-sm text-muted-foreground">
                  {userSubmissionCount}/{practiceChallenge.maxSubmissionsPerUser} submissions used
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Score</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {practiceChallenge.bestScore !== null
                ? `${(practiceChallenge.bestScore * 100).toFixed(1)}%`
                : "No submissions"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {practiceChallenge._count?.submissions || 0}
            </div>
          </CardContent>
        </Card>

        {session && !isCreator && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Submissions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userSubmissionCount}/{practiceChallenge.maxSubmissionsPerUser}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {submissionsRemaining} remaining
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="data">Data & Test Cases</TabsTrigger>
          {session && !isCreator && (
            <TabsTrigger value="my-submissions">My Submissions</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="whitespace-pre-wrap">{practiceChallenge.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Challenge Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-1">Organization</h4>
                  <p className="text-muted-foreground">{practiceChallenge.organizationName}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Model</h4>
                  <p className="text-muted-foreground">{practiceChallenge.modelType}</p>
                </div>
              </div>

              {practiceChallenge.characterLimit && (
                <div>
                  <h4 className="font-semibold mb-1">Character Limit</h4>
                  <p className="text-muted-foreground">{practiceChallenge.characterLimit} characters</p>
                </div>
              )}

              {practiceChallenge.tokenLimit && (
                <div>
                  <h4 className="font-semibold mb-1">Token Limit</h4>
                  <p className="text-muted-foreground">{practiceChallenge.tokenLimit} tokens</p>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-1">Submission Limit</h4>
                <p className="text-muted-foreground">
                  {practiceChallenge.maxSubmissionsPerUser} submission{practiceChallenge.maxSubmissionsPerUser !== 1 ? 's' : ''} per user
                </p>
              </div>
            </CardContent>
          </Card>

          {practiceChallenge.starterPrompt && (
            <Card>
              <CardHeader>
                <CardTitle>Starter Prompt</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="p-4 bg-muted rounded-md overflow-x-auto">
                  <code>{practiceChallenge.starterPrompt}</code>
                </pre>
              </CardContent>
            </Card>
          )}
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
                    <TableHead>User</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {practiceChallenge.submissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No submissions yet. Be the first!
                      </TableCell>
                    </TableRow>
                  ) : (
                    practiceChallenge.submissions.map((submission: any, index: number) => (
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
                  Download Training Data ({practiceChallenge.trainingDataSize} samples)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {session && !isCreator && (
          <TabsContent value="my-submissions">
            <Card>
              <CardHeader>
                <CardTitle>My Submissions</CardTitle>
                <CardDescription>
                  View all your submissions and their scores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Prompt Preview</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!practiceChallenge.userSubmissions || practiceChallenge.userSubmissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          You haven&apos;t made any submissions yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      practiceChallenge.userSubmissions.map((submission: any) => (
                        <TableRow key={submission.id}>
                          <TableCell>{formatDate(submission.submittedAt)}</TableCell>
                          <TableCell>
                            <Badge variant={
                              submission.status === 'COMPLETED' ? 'default' :
                              submission.status === 'FAILED' ? 'destructive' :
                              'secondary'
                            }>
                              {submission.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {submission.score !== null
                              ? `${(submission.score * 100).toFixed(1)}%`
                              : "—"}
                          </TableCell>
                          <TableCell className="max-w-md truncate">
                            {submission.prompt.substring(0, 100)}
                            {submission.prompt.length > 100 ? '...' : ''}
                          </TableCell>
                          <TableCell>
                            <Link href={`/practice/${practiceChallenge.id}/submissions/${submission.id}`}>
                              <Button variant="ghost" size="sm">
                                View Details
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
        )}
      </Tabs>
    </div>
  )
}
