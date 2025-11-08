"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

type CompetitionFormData = {
  title: string
  summary: string
  description: string
  organizationName: string
  modelType: string
  characterLimit: number | null
  tokenLimit: number | null
  examplePrompt: string
  totalPrize: number
  prizeDistribution: string
  firstPlacePrize: number | null
  secondPlacePrize: number | null
  thirdPlacePrize: number | null
  minimumScore: number | null
  targetScore: number | null
  startDate: string
  endDate: string
  trainingFile: File | null
  validationFile: File | null
}

const INITIAL_FORM_DATA: CompetitionFormData = {
  title: "",
  summary: "",
  description: "",
  organizationName: "",
  modelType: "GPT_4",
  characterLimit: null,
  tokenLimit: null,
  examplePrompt: "",
  totalPrize: 0,
  prizeDistribution: "WINNER_TAKES_ALL",
  firstPlacePrize: null,
  secondPlacePrize: null,
  thirdPlacePrize: null,
  minimumScore: null,
  targetScore: null,
  startDate: "",
  endDate: "",
  trainingFile: null,
  validationFile: null,
}

export function CompetitionCreateForm({ userId }: { userId: string }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<CompetitionFormData>(INITIAL_FORM_DATA)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Auto-save to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("competition-draft")
    if (saved) {
      const parsed = JSON.parse(saved)
      setFormData({ ...INITIAL_FORM_DATA, ...parsed })
    }
  }, [])

  useEffect(() => {
    const { trainingFile, validationFile, ...saveable } = formData
    localStorage.setItem("competition-draft", JSON.stringify(saveable))
  }, [formData])

  const updateFormData = (field: keyof CompetitionFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError("")

    try {
      // First, upload files
      const formDataToSend = new FormData()

      if (!formData.trainingFile || !formData.validationFile) {
        setError("Please upload both training and validation files")
        setLoading(false)
        return
      }

      formDataToSend.append("trainingFile", formData.trainingFile)
      formDataToSend.append("validationFile", formData.validationFile)

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formDataToSend,
      })

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload files")
      }

      const { trainingUrl, validationUrl, trainingSize, validationSize } = await uploadResponse.json()

      // Then create competition
      const competitionData = {
        ...formData,
        trainingDataUrl: trainingUrl,
        validationDataUrl: validationUrl,
        trainingDataSize: trainingSize,
        validationDataSize: validationSize,
        totalPrize: parseFloat(formData.totalPrize.toString()),
        firstPlacePrize: formData.firstPlacePrize ? parseFloat(formData.firstPlacePrize.toString()) : null,
        secondPlacePrize: formData.secondPlacePrize ? parseFloat(formData.secondPlacePrize.toString()) : null,
        thirdPlacePrize: formData.thirdPlacePrize ? parseFloat(formData.thirdPlacePrize.toString()) : null,
      }

      const response = await fetch("/api/competitions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(competitionData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to create competition")
        setLoading(false)
        return
      }

      // Clear draft
      localStorage.removeItem("competition-draft")

      // Redirect to competition page
      router.push(`/competitions/${data.id}`)
    } catch (error) {
      setError("An error occurred. Please try again.")
      setLoading(false)
    }
  }

  const nextStep = () => {
    setStep((prev) => Math.min(prev + 1, 4))
  }

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1))
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create Competition</h1>
        <p className="text-muted-foreground">
          Step {step} of 4 - {getStepTitle(step)}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-2 flex-1 mx-1 rounded ${
                i <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Basic Information */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Provide the basic details about your competition
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Competition Title*</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateFormData("title", e.target.value)}
                placeholder="e.g., Customer Support Email Classification"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">One-Line Summary*</Label>
              <Input
                id="summary"
                value={formData.summary}
                onChange={(e) => updateFormData("summary", e.target.value)}
                placeholder="A brief one-sentence description"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Detailed Description*</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                placeholder="Provide a detailed description of what you're looking for..."
                rows={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizationName">Organization Name*</Label>
              <Input
                id="organizationName"
                value={formData.organizationName}
                onChange={(e) => updateFormData("organizationName", e.target.value)}
                placeholder="Your company or organization"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="examplePrompt">Example Prompt (Optional)</Label>
              <Textarea
                id="examplePrompt"
                value={formData.examplePrompt}
                onChange={(e) => updateFormData("examplePrompt", e.target.value)}
                placeholder="Provide an example prompt to guide participants..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Model & Requirements */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Model & Requirements</CardTitle>
            <CardDescription>
              Specify the model and prompt requirements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="modelType">Model Type*</Label>
              <Select
                value={formData.modelType}
                onValueChange={(value) => updateFormData("modelType", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GPT_4">GPT-4</SelectItem>
                  <SelectItem value="GPT_3_5_TURBO">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="CLAUDE_3_OPUS">Claude 3 Opus</SelectItem>
                  <SelectItem value="CLAUDE_3_SONNET">Claude 3 Sonnet</SelectItem>
                  <SelectItem value="CLAUDE_3_HAIKU">Claude 3 Haiku</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="characterLimit">Character Limit (Optional)</Label>
                <Input
                  id="characterLimit"
                  type="number"
                  value={formData.characterLimit || ""}
                  onChange={(e) =>
                    updateFormData("characterLimit", e.target.value ? parseInt(e.target.value) : null)
                  }
                  placeholder="e.g., 1000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tokenLimit">Token Limit (Optional)</Label>
                <Input
                  id="tokenLimit"
                  type="number"
                  value={formData.tokenLimit || ""}
                  onChange={(e) =>
                    updateFormData("tokenLimit", e.target.value ? parseInt(e.target.value) : null)
                  }
                  placeholder="e.g., 200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date*</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => updateFormData("startDate", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date*</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => updateFormData("endDate", e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Data Upload */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Training & Validation Data</CardTitle>
            <CardDescription>
              Upload your test cases in JSON format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="trainingFile">Training Data (JSON)*</Label>
              <Input
                id="trainingFile"
                type="file"
                accept=".json"
                onChange={(e) => updateFormData("trainingFile", e.target.files?.[0] || null)}
                required
              />
              <p className="text-sm text-muted-foreground">
                Upload a JSON file with training examples (public test cases)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="validationFile">Validation Data (JSON)*</Label>
              <Input
                id="validationFile"
                type="file"
                accept=".json"
                onChange={(e) => updateFormData("validationFile", e.target.files?.[0] || null)}
                required
              />
              <p className="text-sm text-muted-foreground">
                Upload a JSON file with validation examples (used for scoring)
              </p>
            </div>

            <Alert>
              <AlertDescription>
                <strong>JSON Format:</strong> Each file should contain an array of objects with &quot;input&quot; and &quot;expectedOutput&quot; fields.
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
{`[
  {
    "input": "Your input here",
    "expectedOutput": "Expected output"
  }
]`}
                </pre>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Prizes & Completion */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Prize Distribution</CardTitle>
            <CardDescription>
              Configure how prizes will be awarded
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="totalPrize">Total Prize Pool*</Label>
              <Input
                id="totalPrize"
                type="number"
                step="0.01"
                value={formData.totalPrize || ""}
                onChange={(e) => updateFormData("totalPrize", parseFloat(e.target.value))}
                placeholder="e.g., 1000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prizeDistribution">Distribution Type*</Label>
              <Select
                value={formData.prizeDistribution}
                onValueChange={(value) => updateFormData("prizeDistribution", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WINNER_TAKES_ALL">Winner Takes All</SelectItem>
                  <SelectItem value="TOP_THREE">Top 3 Places</SelectItem>
                  <SelectItem value="THRESHOLD_BASED">Threshold Based</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.prizeDistribution === "TOP_THREE" && (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstPlacePrize">1st Place</Label>
                  <Input
                    id="firstPlacePrize"
                    type="number"
                    step="0.01"
                    value={formData.firstPlacePrize || ""}
                    onChange={(e) =>
                      updateFormData("firstPlacePrize", e.target.value ? parseFloat(e.target.value) : null)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondPlacePrize">2nd Place</Label>
                  <Input
                    id="secondPlacePrize"
                    type="number"
                    step="0.01"
                    value={formData.secondPlacePrize || ""}
                    onChange={(e) =>
                      updateFormData("secondPlacePrize", e.target.value ? parseFloat(e.target.value) : null)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="thirdPlacePrize">3rd Place</Label>
                  <Input
                    id="thirdPlacePrize"
                    type="number"
                    step="0.01"
                    value={formData.thirdPlacePrize || ""}
                    onChange={(e) =>
                      updateFormData("thirdPlacePrize", e.target.value ? parseFloat(e.target.value) : null)
                    }
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minimumScore">Minimum Score (Optional)</Label>
                <Input
                  id="minimumScore"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={formData.minimumScore || ""}
                  onChange={(e) =>
                    updateFormData("minimumScore", e.target.value ? parseFloat(e.target.value) : null)
                  }
                  placeholder="e.g., 0.80"
                />
                <p className="text-sm text-muted-foreground">
                  No prize if this threshold isn&apos;t met
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetScore">Target Score (Optional)</Label>
                <Input
                  id="targetScore"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={formData.targetScore || ""}
                  onChange={(e) =>
                    updateFormData("targetScore", e.target.value ? parseFloat(e.target.value) : null)
                  }
                  placeholder="e.g., 0.95"
                />
                <p className="text-sm text-muted-foreground">
                  Competition ends immediately if reached
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          disabled={step === 1 || loading}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        {step < 4 ? (
          <Button type="button" onClick={nextStep}>
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Competition"
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

function getStepTitle(step: number): string {
  switch (step) {
    case 1:
      return "Basic Information"
    case 2:
      return "Model & Requirements"
    case 3:
      return "Data Upload"
    case 4:
      return "Prizes & Completion"
    default:
      return ""
  }
}
