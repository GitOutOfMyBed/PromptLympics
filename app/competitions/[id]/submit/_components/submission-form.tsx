"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/_components/providers/auth-provider"
import { Button } from "@/app/_components/ui/button"
import { Textarea } from "@/app/_components/ui/textarea"
import { Label } from "@/app/_components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card"
import { Alert, AlertDescription } from "@/app/_components/ui/alert"
import { Loader2 } from "lucide-react"

type SubmissionFormProps = {
  competition: any
  userId: string
}

export function SubmissionForm({ competition, userId }: SubmissionFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!user) {
      setError("You must be logged in to submit")
      setLoading(false)
      return
    }

    // Validate prompt
    if (!prompt.trim()) {
      setError("Prompt cannot be empty")
      setLoading(false)
      return
    }

    // Validate character limit
    if (competition.characterLimit && prompt.length > competition.characterLimit) {
      setError(`Prompt exceeds character limit of ${competition.characterLimit}`)
      setLoading(false)
      return
    }

    // Validate token limit (rough estimate: 1 token ≈ 4 characters)
    if (competition.tokenLimit) {
      const estimatedTokens = Math.ceil(prompt.length / 4)
      if (estimatedTokens > competition.tokenLimit) {
        setError(`Prompt may exceed token limit of ${competition.tokenLimit} (estimated: ${estimatedTokens})`)
        setLoading(false)
        return
      }
    }

    try {
      const token = await user.getIdToken()

      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          competitionId: competition.id,
          prompt,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to submit prompt")
        setLoading(false)
        return
      }

      // Redirect to submission results page
      router.push(`/competitions/${competition.id}/submissions/${data.id}`)
    } catch (error) {
      setError("An error occurred. Please try again.")
      setLoading(false)
    }
  }

  const characterCount = prompt.length
  const isOverLimit = competition.characterLimit && characterCount > competition.characterLimit

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Submit Your Prompt</h1>
        <p className="text-muted-foreground">{competition.title}</p>
      </div>

      {competition.examplePrompt && (
        <Card>
          <CardHeader>
            <CardTitle>Example Prompt</CardTitle>
            <CardDescription>
              Use this as a reference for your submission
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="p-4 bg-muted rounded-md overflow-x-auto text-sm">
              <code>{competition.examplePrompt}</code>
            </pre>
          </CardContent>
        </Card>
      )}

      {competition.testCases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sample Test Cases</CardTitle>
            <CardDescription>
              Your prompt will be evaluated against these and other hidden test cases
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {competition.testCases.map((testCase: any) => (
              <div key={testCase.id} className="space-y-2">
                <div>
                  <span className="font-semibold text-sm">Input:</span>
                  <pre className="mt-1 p-2 bg-muted rounded text-sm overflow-x-auto">
                    {testCase.input}
                  </pre>
                </div>
                <div>
                  <span className="font-semibold text-sm">Expected Output:</span>
                  <pre className="mt-1 p-2 bg-muted rounded text-sm overflow-x-auto">
                    {testCase.expectedOutput}
                  </pre>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Your Prompt</CardTitle>
            <CardDescription>
              Enter your optimized prompt below
              {competition.characterLimit && (
                <span className="ml-2">
                  ({characterCount}/{competition.characterLimit} characters)
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt here..."
                rows={12}
                required
                className={isOverLimit ? "border-destructive" : ""}
              />
              {isOverLimit && (
                <p className="text-sm text-destructive">
                  Exceeds character limit by {characterCount - competition.characterLimit!} characters
                </p>
              )}
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading || isOverLimit}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Prompt"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
