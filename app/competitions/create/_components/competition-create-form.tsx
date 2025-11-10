"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/_components/providers/auth-provider"
import { storage, auth } from "@/firebase/firebasefrontend"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { Button } from "@/app/_components/ui/button"
import { Input } from "@/app/_components/ui/input"
import { Textarea } from "@/app/_components/ui/textarea"
import { Label } from "@/app/_components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card"
import { Alert, AlertDescription } from "@/app/_components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/_components/ui/select"
import { Checkbox } from "@/app/_components/ui/checkbox"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { getSupportedModelsList } from "@/lib/llm"

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
  useOrganizerKey: boolean
  apiKey: string
}

const INITIAL_FORM_DATA: CompetitionFormData = {
  title: "",
  summary: "",
  description: "",
  organizationName: "",
  modelType: "gpt-4o-mini",
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
  useOrganizerKey: false,
  apiKey: "",
}

export function CompetitionCreateForm({ userId }: { userId: string }) {
  const router = useRouter()
  const { user } = useAuth()
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

  const validateForm = (): string | null => {
    // Required fields validation
    if (!formData.title.trim()) {
      return "Title is required"
    }
    if (!formData.summary.trim()) {
      return "Summary is required"
    }
    if (!formData.description.trim()) {
      return "Description is required"
    }
    if (!formData.organizationName.trim()) {
      return "Organization name is required"
    }
    if (!formData.modelType) {
      return "Model type is required"
    }
    if (!formData.startDate) {
      return "Start date is required"
    }
    if (!formData.endDate) {
      return "End date is required"
    }
    if (!formData.trainingFile) {
      return "Training data file is required"
    }
    if (!formData.validationFile) {
      return "Validation data file is required"
    }

    // Date validation
    const startDate = new Date(formData.startDate)
    const endDate = new Date(formData.endDate)

    if (isNaN(startDate.getTime())) {
      return "Invalid start date"
    }
    if (isNaN(endDate.getTime())) {
      return "Invalid end date"
    }
    if (endDate <= startDate) {
      return "End date must be after start date"
    }

    // Prize validation
    if (formData.totalPrize < 0) {
      return "Total prize cannot be negative"
    }

    // Prizes must be whole dollar amounts (no cents)
    if (!Number.isInteger(formData.totalPrize)) {
      return "Total prize must be a whole dollar amount (no cents)"
    }

    if (formData.prizeDistribution === "TOP_THREE") {
      const first = formData.firstPlacePrize || 0
      const second = formData.secondPlacePrize || 0
      const third = formData.thirdPlacePrize || 0
      const total = first + second + third

      if (first < 0 || second < 0 || third < 0) {
        return "Prize values cannot be negative"
      }

      if (!Number.isInteger(first) || !Number.isInteger(second) || !Number.isInteger(third)) {
        return "Prize values must be whole dollar amounts (no cents)"
      }

      if (total !== formData.totalPrize) {
        return `Prize values must sum to total prize (${total} ≠ ${formData.totalPrize})`
      }
    }

    // Limits validation
    if (formData.characterLimit && formData.characterLimit < 1) {
      return "Character limit must be at least 1"
    }
    if (formData.tokenLimit && formData.tokenLimit < 1) {
      return "Token limit must be at least 1"
    }

    // Score validation
    if (formData.minimumScore !== null && formData.minimumScore < 0) {
      return "Minimum score cannot be negative"
    }
    if (formData.targetScore !== null && formData.targetScore < 0) {
      return "Target score cannot be negative"
    }
    if (
      formData.minimumScore !== null &&
      formData.targetScore !== null &&
      formData.targetScore < formData.minimumScore
    ) {
      return "Target score must be greater than minimum score"
    }

    // API key validation
    if (formData.useOrganizerKey) {
      if (!formData.apiKey) {
        return "API key is required when using your own key"
      }

      // Validate API key format
      if (formData.modelType.startsWith('gpt') && !formData.apiKey.startsWith('sk-')) {
        return "Invalid OpenAI API key format (should start with 'sk-')"
      }
      if (formData.modelType.startsWith('claude') && !formData.apiKey.startsWith('sk-ant-')) {
        return "Invalid Anthropic API key format (should start with 'sk-ant-')"
      }
      if (formData.modelType.startsWith('gemini') && !formData.apiKey.startsWith('AIza')) {
        return "Invalid Google AI API key format (should start with 'AIza')"
      }
    }

    return null
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError("")

    try {
      if (!user) {
        setError("You must be logged in to create a competition")
        setLoading(false)
        return
      }

      // Validate form
      const validationError = validateForm()
      if (validationError) {
        setError(validationError)
        setLoading(false)
        return
      }

      // Get Firebase ID token
      const token = await user.getIdToken()

      // Upload files to Firebase Storage
      const timestamp = Date.now()
      const trainingRef = ref(storage, `competitions/${user.uid}/${timestamp}/training.json`)
      const validationRef = ref(storage, `competitions/${user.uid}/${timestamp}/validation.json`)
      const validationPath = `competitions/${user.uid}/${timestamp}/validation.json`

      console.log("Uploading files to Firebase Storage...")
      console.log("User UID:", user.uid)
      console.log("User email:", user.email)
      console.log("Training path:", `competitions/${user.uid}/${timestamp}/training.json`)
      console.log("Validation path:", validationPath)

      // Check if user is authenticated
      const currentUser = auth.currentUser
      console.log("Is authenticated:", !!currentUser)
      if (currentUser) {
        const token = await currentUser.getIdToken()
        console.log("Has token:", !!token)
      }

      // Upload training file (public - get download URL)
      try {
        await uploadBytes(trainingRef, formData.trainingFile!)
        console.log("Training file uploaded successfully")
      } catch (uploadError) {
        console.error("Upload error:", uploadError)
        throw uploadError
      }
      const trainingUrl = await getDownloadURL(trainingRef)

      // Upload validation file (private - only store path)
      await uploadBytes(validationRef, formData.validationFile!)
      console.log("Validation file uploaded successfully")

      // Parse files to get sizes
      const trainingText = await formData.trainingFile!.text()
      const validationText = await formData.validationFile!.text()

      const trainingData = JSON.parse(trainingText)
      const validationData = JSON.parse(validationText)

      const trainingSize = Array.isArray(trainingData) ? trainingData.length : 0
      const validationSize = Array.isArray(validationData) ? validationData.length : 0

      console.log("Files uploaded successfully")

      // Then create competition
      const competitionData = {
        ...formData,
        trainingDataUrl: trainingUrl,
        validationDataUrl: "",  // Deprecated - keeping for schema compatibility
        validationDataPath: validationPath,
        trainingDataSize: trainingSize,
        validationDataSize: validationSize,
        totalPrize: parseInt(formData.totalPrize.toString()),
        firstPlacePrize: formData.firstPlacePrize ? parseInt(formData.firstPlacePrize.toString()) : null,
        secondPlacePrize: formData.secondPlacePrize ? parseInt(formData.secondPlacePrize.toString()) : null,
        thirdPlacePrize: formData.thirdPlacePrize ? parseInt(formData.thirdPlacePrize.toString()) : null,
      }

      const response = await fetch("/api/competitions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
              <Label htmlFor="modelType">LLM Model*</Label>
              <Select
                value={formData.modelType}
                onValueChange={(value) => updateFormData("modelType", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* Group by provider for better organization */}
                  <div className="text-xs font-semibold px-2 py-1 text-muted-foreground">OpenAI</div>
                  {getSupportedModelsList()
                    .filter(model => model.provider === 'openai')
                    .map(model => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))
                  }

                  <div className="text-xs font-semibold px-2 py-1 text-muted-foreground mt-2">Anthropic</div>
                  {getSupportedModelsList()
                    .filter(model => model.provider === 'anthropic')
                    .map(model => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))
                  }

                  <div className="text-xs font-semibold px-2 py-1 text-muted-foreground mt-2">Google</div>
                  {getSupportedModelsList()
                    .filter(model => model.provider === 'google')
                    .map(model => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>

            {/* API Key Configuration */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useOrganizerKey"
                  checked={formData.useOrganizerKey}
                  onCheckedChange={(checked) => updateFormData("useOrganizerKey", checked as boolean)}
                />
                <Label htmlFor="useOrganizerKey" className="text-sm font-medium cursor-pointer">
                  Use my own API key for evaluations
                </Label>
              </div>

              {formData.useOrganizerKey && (
                <>
                  <Alert>
                    <AlertDescription>
                      Your API key will be encrypted and used only for evaluating submissions to this competition.
                      The key is never shared with participants.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="apiKey">
                      {formData.modelType.startsWith('gpt') && 'OpenAI API Key*'}
                      {formData.modelType.startsWith('claude') && 'Anthropic API Key*'}
                      {formData.modelType.startsWith('gemini') && 'Google AI API Key*'}
                    </Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder={
                        formData.modelType.startsWith('gpt') ? 'sk-...' :
                        formData.modelType.startsWith('claude') ? 'sk-ant-...' :
                        'AIza...'
                      }
                      value={formData.apiKey}
                      onChange={(e) => updateFormData("apiKey", e.target.value)}
                      required={formData.useOrganizerKey}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.modelType.startsWith('gpt') && (
                        <>Get your key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI Dashboard</a></>
                      )}
                      {formData.modelType.startsWith('claude') && (
                        <>Get your key from <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="underline">Anthropic Console</a></>
                      )}
                      {formData.modelType.startsWith('gemini') && (
                        <>Get your key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a></>
                      )}
                    </p>
                  </div>
                </>
              )}
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
                step="1"
                min="0"
                value={formData.totalPrize || ""}
                onChange={(e) => updateFormData("totalPrize", parseInt(e.target.value) || 0)}
                placeholder="e.g., 1000 (whole dollars only)"
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
                    step="1"
                    min="0"
                    value={formData.firstPlacePrize || ""}
                    onChange={(e) =>
                      updateFormData("firstPlacePrize", e.target.value ? parseInt(e.target.value) : null)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondPlacePrize">2nd Place</Label>
                  <Input
                    id="secondPlacePrize"
                    type="number"
                    step="1"
                    min="0"
                    value={formData.secondPlacePrize || ""}
                    onChange={(e) =>
                      updateFormData("secondPlacePrize", e.target.value ? parseInt(e.target.value) : null)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="thirdPlacePrize">3rd Place</Label>
                  <Input
                    id="thirdPlacePrize"
                    type="number"
                    step="1"
                    min="0"
                    value={formData.thirdPlacePrize || ""}
                    onChange={(e) =>
                      updateFormData("thirdPlacePrize", e.target.value ? parseInt(e.target.value) : null)
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
