"use client";

import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Button } from "@/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { ArrowLeft, Loader2, CheckCircle, XCircle } from "lucide-react";

type PracticeSubmissionDetailsProps = {
  submission: any;
  currentUserId: string;
};

export function PracticeSubmissionDetails({
  submission,
  currentUserId,
}: PracticeSubmissionDetailsProps) {
  const evaluationDetails = submission.evaluationLog
    ? JSON.parse(submission.evaluationLog)
    : null;

  const isCreator = currentUserId === submission.practiceChallenge.creatorId;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/practice/${submission.practiceChallengeId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Practice Challenge
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold mb-2">Practice Submission Details</h1>
        <p className="text-muted-foreground">{submission.practiceChallenge.title}</p>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Submission Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
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
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Score</p>
              {submission.status === "COMPLETED" &&
              submission.score !== null ? (
                <p className="text-2xl font-bold">
                  {(submission.score * 100).toFixed(1)}%
                </p>
              ) : submission.status === "EVALUATING" ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Evaluating...</span>
                </div>
              ) : (
                <p className="text-muted-foreground">-</p>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Submitted</p>
              <p className="font-medium">
                {formatDate(submission.submittedAt)}
              </p>
            </div>

            {submission.evaluatedAt && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Evaluated</p>
                <p className="font-medium">
                  {formatDate(submission.evaluatedAt)}
                </p>
              </div>
            )}
          </div>

          {submission.errorMessage && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md">
              <p className="text-sm font-semibold mb-1">Error</p>
              <p className="text-sm">{submission.errorMessage}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prompt Card */}
      <Card>
        <CardHeader>
          <CardTitle>Your Prompt</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="p-4 bg-muted rounded-md overflow-x-auto whitespace-pre-wrap">
            <code>{submission.prompt}</code>
          </pre>
        </CardContent>
      </Card>

      {/* Detailed Test Case Results - Users can see their own results for practice! */}
      {evaluationDetails &&
        submission.status === "COMPLETED" && (
          <Card>
            <CardHeader>
              <CardTitle>Test Case Details</CardTitle>
              <CardDescription>
                Detailed results for each test case - review these to improve your prompt!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {evaluationDetails.map((detail: any, index: number) => (
                <Card
                  key={index}
                  className={
                    detail.correct ? "border-green-500/50" : "border-red-500/50"
                  }
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-2 mb-3">
                      {detail.correct ? (
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold mb-2">
                          Test Case {index + 1} -{" "}
                          {detail.correct ? "Passed" : "Failed"}
                        </p>

                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-semibold text-muted-foreground mb-1">
                              Input:
                            </p>
                            <pre className="p-2 bg-muted rounded text-sm overflow-x-auto">
                              {detail.input}
                            </pre>
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-muted-foreground mb-1">
                              Expected Output:
                            </p>
                            <pre className="p-2 bg-muted rounded text-sm overflow-x-auto">
                              {detail.expectedOutput}
                            </pre>
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-muted-foreground mb-1">
                              Actual Output:
                            </p>
                            <pre
                              className={`p-2 rounded text-sm overflow-x-auto ${
                                detail.correct
                                  ? "bg-green-50 text-green-900"
                                  : "bg-red-50 text-red-900"
                              }`}
                            >
                              {detail.actualOutput || "No output"}
                            </pre>
                          </div>

                          {detail.error && (
                            <div>
                              <p className="text-sm font-semibold text-destructive mb-1">
                                Error:
                              </p>
                              <p className="text-sm text-destructive">
                                {detail.error}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}
    </div>
  );
}
