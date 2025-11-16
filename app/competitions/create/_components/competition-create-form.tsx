"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/_components/providers/auth-provider";
import { storage, auth } from "@/firebase/firebasefrontend";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Textarea } from "@/app/_components/ui/textarea";
import { Label } from "@/app/_components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Alert, AlertDescription } from "@/app/_components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { Checkbox } from "@/app/_components/ui/checkbox";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  KeyRound,
  AlertTriangle,
} from "lucide-react";
import { getSupportedModelsList } from "@/lib/llm";
import type { CompetitionFormData } from "@/lib/types";

const getInitialDates = () => {
  const today = new Date();
  const oneWeekLater = new Date(today);
  oneWeekLater.setDate(today.getDate() + 7);

  return {
    startDate: today.toISOString().slice(0, 16),
    endDate: oneWeekLater.toISOString().slice(0, 16),
  };
};

const INITIAL_FORM_DATA: CompetitionFormData = {
  title: "",
  description: "",
  organizationName: "",
  modelType: "gpt-5-mini",
  characterLimit: null,
  tokenLimit: null,
  starterPrompt: "",
  totalPrize: 0,
  prizeDistribution: "WINNER_TAKES_ALL",
  firstPlacePrize: null,
  secondPlacePrize: null,
  thirdPlacePrize: null,
  minimumScore: null,
  targetScore: null,
  maxSubmissionsPerUser: 3,
  ...getInitialDates(),
  trainingFile: null,
  validationFile: null,
  useOrganizerKey: true,
  apiKey: "",
};

/** Multi-step form for creating competitions - auto-saves to localStorage */
export function CompetitionCreateForm({ userId }: { userId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] =
    useState<CompetitionFormData>(INITIAL_FORM_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-save to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("competition-draft");
    if (saved) {
      const parsed = JSON.parse(saved);
      setFormData({ ...INITIAL_FORM_DATA, ...parsed });
    }
  }, []);

  useEffect(() => {
    const { trainingFile, validationFile, ...saveable } = formData;
    localStorage.setItem("competition-draft", JSON.stringify(saveable));
  }, [formData]);

  const updateFormData = (field: keyof CompetitionFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): string | null => {
    // Required fields validation
    if (!formData.title.trim()) {
      return "Title is required";
    }
    if (!formData.description.trim()) {
      return "Description is required";
    }
    if (!formData.organizationName.trim()) {
      return "Organization name is required";
    }
    if (!formData.modelType) {
      return "Model type is required";
    }
    if (!formData.startDate) {
      return "Start date is required";
    }
    if (!formData.endDate) {
      return "End date is required";
    }
    if (!formData.trainingFile) {
      return "Training data file is required";
    }
    if (!formData.validationFile) {
      return "Validation data file is required";
    }

    // Date validation
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (isNaN(startDate.getTime())) {
      return "Invalid start date";
    }
    if (isNaN(endDate.getTime())) {
      return "Invalid end date";
    }
    if (endDate <= startDate) {
      return "End date must be after start date";
    }

    // Prize validation
    if (formData.totalPrize < 0) {
      return "Total prize cannot be negative";
    }

    // Prizes must be whole dollar amounts (no cents)
    if (!Number.isInteger(formData.totalPrize)) {
      return "Total prize must be a whole dollar amount (no cents)";
    }

    if (formData.prizeDistribution === "TOP_THREE") {
      const first = formData.firstPlacePrize || 0;
      const second = formData.secondPlacePrize || 0;
      const third = formData.thirdPlacePrize || 0;
      const total = first + second + third;

      if (first < 0 || second < 0 || third < 0) {
        return "Prize values cannot be negative";
      }

      if (
        !Number.isInteger(first) ||
        !Number.isInteger(second) ||
        !Number.isInteger(third)
      ) {
        return "Prize values must be whole dollar amounts (no cents)";
      }

      if (total !== formData.totalPrize) {
        return `Prize values must sum to total prize (${total} ≠ ${formData.totalPrize})`;
      }
    }

    // Limits validation
    if (formData.characterLimit && formData.characterLimit < 1) {
      return "Character limit must be at least 1";
    }
    if (formData.tokenLimit && formData.tokenLimit < 1) {
      return "Token limit must be at least 1";
    }

    // Score validation
    if (formData.minimumScore !== null && formData.minimumScore < 0) {
      return "Minimum score cannot be negative";
    }
    if (formData.targetScore !== null && formData.targetScore < 0) {
      return "Target score cannot be negative";
    }
    if (
      formData.minimumScore !== null &&
      formData.targetScore !== null &&
      formData.targetScore < formData.minimumScore
    ) {
      return "Target score must be greater than minimum score";
    }

    // Submission limit validation
    if (!formData.maxSubmissionsPerUser || formData.maxSubmissionsPerUser < 1) {
      return "Maximum submissions per user must be at least 1";
    }

    // API key validation
    if (!formData.apiKey) {
      return "API key is required";
    }

    // Validate API key format
    if (
      formData.modelType.startsWith("gpt") &&
      !formData.apiKey.startsWith("sk-")
    ) {
      return "Invalid OpenAI API key format (should start with 'sk-')";
    }
    if (
      formData.modelType.startsWith("claude") &&
      !formData.apiKey.startsWith("sk-ant-")
    ) {
      return "Invalid Anthropic API key format (should start with 'sk-ant-')";
    }
    if (
      formData.modelType.startsWith("gemini") &&
      !formData.apiKey.startsWith("AIza")
    ) {
      return "Invalid Google AI API key format (should start with 'AIza')";
    }

    return null;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      if (!user) {
        setError("You must be logged in to create a competition");
        setLoading(false);
        return;
      }

      // Validate form
      const validationError = validateForm();
      if (validationError) {
        setError(validationError);
        setLoading(false);
        return;
      }

      // Get Firebase ID token
      const token = await user.getIdToken();

      // Upload training (public) and validation (private) files to Firebase Storage
      const timestamp = Date.now();
      const trainingRef = ref(
        storage,
        `competitions/${user.uid}/${timestamp}/training.json`
      );
      const validationRef = ref(
        storage,
        `competitions/${user.uid}/${timestamp}/validation.json`
      );
      const validationPath = `competitions/${user.uid}/${timestamp}/validation.json`;

      console.log("Uploading files to Firebase Storage...");
      console.log("User UID:", user.uid);
      console.log("User email:", user.email);
      console.log(
        "Training path:",
        `competitions/${user.uid}/${timestamp}/training.json`
      );
      console.log("Validation path:", validationPath);

      // Check if user is authenticated
      const currentUser = auth.currentUser;
      console.log("Is authenticated:", !!currentUser);
      if (currentUser) {
        const token = await currentUser.getIdToken();
        console.log("Has token:", !!token);
      }

      // Upload training file (public - get download URL)
      try {
        await uploadBytes(trainingRef, formData.trainingFile!);
        console.log("Training file uploaded successfully");
      } catch (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }
      const trainingUrl = await getDownloadURL(trainingRef);

      // Upload validation file (private - only store path)
      await uploadBytes(validationRef, formData.validationFile!);
      console.log("Validation file uploaded successfully");

      // Parse files to get sizes
      const trainingText = await formData.trainingFile!.text();
      const validationText = await formData.validationFile!.text();

      const trainingData = JSON.parse(trainingText);
      const validationData = JSON.parse(validationText);

      const trainingSize = Array.isArray(trainingData)
        ? trainingData.length
        : 0;
      const validationSize = Array.isArray(validationData)
        ? validationData.length
        : 0;

      console.log("Files uploaded successfully");

      // Then create competition
      const competitionData = {
        ...formData,
        trainingDataUrl: trainingUrl,
        validationDataUrl: validationPath, // Storage path (not a URL)
        trainingDataSize: trainingSize,
        validationDataSize: validationSize,
        totalPrize: parseInt(formData.totalPrize.toString()),
        firstPlacePrize: formData.firstPlacePrize
          ? parseInt(formData.firstPlacePrize.toString())
          : null,
        secondPlacePrize: formData.secondPlacePrize
          ? parseInt(formData.secondPlacePrize.toString())
          : null,
        thirdPlacePrize: formData.thirdPlacePrize
          ? parseInt(formData.thirdPlacePrize.toString())
          : null,
      };

      const response = await fetch("/api/competitions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(competitionData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create competition");
        setLoading(false);
        return;
      }

      // Clear draft
      localStorage.removeItem("competition-draft");

      // Redirect to competition page
      router.push(`/competitions/${data.id}`);
    } catch (error) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  const nextStep = () => {
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create Competition</h1>
        <p className="text-muted-foreground">
          Step {step} of 3 - {getStepTitle(step)}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {[1, 2, 3].map((i) => (
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
              <Label htmlFor="description">Description*</Label>
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
                onChange={(e) =>
                  updateFormData("organizationName", e.target.value)
                }
                placeholder="Your company or organization"
                required
              />
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

            <div className="space-y-2">
              <Label htmlFor="starterPrompt">Starter Prompt (Optional)</Label>
              <Textarea
                id="starterPrompt"
                value={formData.starterPrompt}
                onChange={(e) =>
                  updateFormData("starterPrompt", e.target.value)
                }
                placeholder="Provide the current best prompt to help guide participants..."
                rows={4}
              />
            </div>

            {/* Training & Validation Data */}
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="trainingFile">Training Data (JSON)*</Label>
                <Input
                  id="trainingFile"
                  type="file"
                  accept=".json"
                  onChange={(e) =>
                    updateFormData("trainingFile", e.target.files?.[0] || null)
                  }
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
                  onChange={(e) =>
                    updateFormData(
                      "validationFile",
                      e.target.files?.[0] || null
                    )
                  }
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Upload a JSON file with validation examples (used for scoring)
                </p>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>JSON Format:</strong> Each file should contain an
                  array of objects with &quot;input&quot; and
                  &quot;expectedOutput&quot; fields.
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Inference Requirements */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Inference Requirements</CardTitle>
            <CardDescription>
              Specify the model and inference parameters
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
                  <div className="text-xs font-semibold px-2 py-1 text-muted-foreground">
                    OpenAI
                  </div>
                  {getSupportedModelsList()
                    .filter((model) => model.provider === "openai")
                    .map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}

                  <div className="text-xs font-semibold px-2 py-1 text-muted-foreground mt-2">
                    Anthropic
                  </div>
                  {getSupportedModelsList()
                    .filter((model) => model.provider === "anthropic")
                    .map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}

                  <div className="text-xs font-semibold px-2 py-1 text-muted-foreground mt-2">
                    Google
                  </div>
                  {getSupportedModelsList()
                    .filter((model) => model.provider === "google")
                    .map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* API Key Configuration */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2 mb-2">
                <KeyRound className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">API Key Configuration</h3>
              </div>

              <Alert variant="destructive" className="border-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="ml-2">
                  <strong>Important Information:</strong>
                  <ul className="mt-2 ml-4 list-disc space-y-1 text-sm">
                    <li>
                      Your API key will be encrypted and automatically deleted
                      after the competition ends
                    </li>
                    <li>
                      It will only be used to evaluate submissions for this
                      competition
                    </li>
                    <li>The key is never shared with participants</li>
                    <li>
                      We strongly recommend creating a temporary key with
                      spending limits
                    </li>
                    <li>
                      If your key runs out of funds, the competition will end
                      early
                    </li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="apiKey" className="text-base font-semibold">
                      {formData.modelType.startsWith("gpt") &&
                        "OpenAI API Key*"}
                      {formData.modelType.startsWith("claude") &&
                        "Anthropic API Key*"}
                      {formData.modelType.startsWith("gemini") &&
                        "Google AI API Key*"}
                    </Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder={
                        formData.modelType.startsWith("gpt")
                          ? "sk-..."
                          : formData.modelType.startsWith("claude")
                          ? "sk-ant-..."
                          : "AIza..."
                      }
                      value={formData.apiKey}
                      onChange={(e) => updateFormData("apiKey", e.target.value)}
                      required
                      className="font-mono"
                    />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {formData.modelType.startsWith("gpt") && (
                        <>
                          <span>Get your key from</span>
                          <a
                            href="https://platform.openai.com/api-keys"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-primary font-medium"
                          >
                            OpenAI Dashboard →
                          </a>
                        </>
                      )}
                      {formData.modelType.startsWith("claude") && (
                        <>
                          <span>Get your key from</span>
                          <a
                            href="https://console.anthropic.com/settings/keys"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-primary font-medium"
                          >
                            Anthropic Console →
                          </a>
                        </>
                      )}
                      {formData.modelType.startsWith("gemini") && (
                        <>
                          <span>Get your key from</span>
                          <a
                            href="https://makersuite.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-primary font-medium"
                          >
                            Google AI Studio →
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* TODO: Inference Configuration Section
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Inference Configuration</h3>
              </div>

              <Alert>
                <AlertDescription>
                  Configure how the model will generate responses for submissions.
                  These settings affect creativity, output length, and consistency.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="temperature">
                    Temperature
                    <span className="text-muted-foreground ml-2">(0-2)</span>
                  </Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={formData.temperature || ""}
                    onChange={(e) =>
                      updateFormData(
                        "temperature",
                        e.target.value ? parseFloat(e.target.value) : null
                      )
                    }
                    placeholder="e.g., 0.7"
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher values make output more random, lower values more focused
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxTokens">
                    Max Output Tokens
                    <span className="text-muted-foreground ml-2">(Optional)</span>
                  </Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    value={formData.maxTokens || ""}
                    onChange={(e) =>
                      updateFormData(
                        "maxTokens",
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    placeholder="e.g., 1000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum tokens in model response
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="topP">
                    Top P
                    <span className="text-muted-foreground ml-2">(0-1)</span>
                  </Label>
                  <Input
                    id="topP"
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={formData.topP || ""}
                    onChange={(e) =>
                      updateFormData(
                        "topP",
                        e.target.value ? parseFloat(e.target.value) : null
                      )
                    }
                    placeholder="e.g., 0.9"
                  />
                  <p className="text-xs text-muted-foreground">
                    Nucleus sampling threshold
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frequencyPenalty">
                    Frequency Penalty
                    <span className="text-muted-foreground ml-2">(0-2)</span>
                  </Label>
                  <Input
                    id="frequencyPenalty"
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={formData.frequencyPenalty || ""}
                    onChange={(e) =>
                      updateFormData(
                        "frequencyPenalty",
                        e.target.value ? parseFloat(e.target.value) : null
                      )
                    }
                    placeholder="e.g., 0.5"
                  />
                  <p className="text-xs text-muted-foreground">
                    Reduces repetition of tokens
                  </p>
                </div>
              </div>
            </div>
            */}

            {/* TODO: Prompt Constraints Section
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Prompt Constraints</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="characterLimit">
                    Character Limit (Optional)
                  </Label>
                  <Input
                    id="characterLimit"
                    type="number"
                    value={formData.characterLimit || ""}
                    onChange={(e) =>
                      updateFormData(
                        "characterLimit",
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    placeholder="e.g., 1000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum characters allowed in submission
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tokenLimit">Token Limit (Optional)</Label>
                  <Input
                    id="tokenLimit"
                    type="number"
                    value={formData.tokenLimit || ""}
                    onChange={(e) =>
                      updateFormData(
                        "tokenLimit",
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    placeholder="e.g., 200"
                  />
                  <p className="text-xs text-muted-foreground">
                    Estimated token limit for submission
                  </p>
                </div>
              </div>
            </div>
            */}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Prizes & Completion */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Prize Distribution</CardTitle>
            <CardDescription>
              Coming Soon - Prize money feature will be available in a future
              update
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Prize money functionality is currently under development. For
                now, all competitions are set with $0 prize pool. This feature
                will be enabled in an upcoming release.
              </AlertDescription>
            </Alert>

            {/* Commented out - Prize configuration will be available soon
            <div className="space-y-2">
              <Label htmlFor="totalPrize">Total Prize Pool*</Label>
              <Input
                id="totalPrize"
                type="number"
                step="1"
                min="0"
                value={formData.totalPrize || ""}
                onChange={(e) =>
                  updateFormData("totalPrize", parseInt(e.target.value) || 0)
                }
                placeholder="e.g., 1000 (whole dollars only)"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prizeDistribution">Distribution Type*</Label>
              <Select
                value={formData.prizeDistribution}
                onValueChange={(value) =>
                  updateFormData("prizeDistribution", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WINNER_TAKES_ALL">
                    Winner Takes All
                  </SelectItem>
                  <SelectItem value="TOP_THREE">Top 3 Places</SelectItem>
                  <SelectItem value="THRESHOLD_BASED">
                    Threshold Based
                  </SelectItem>
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
                      updateFormData(
                        "firstPlacePrize",
                        e.target.value ? parseInt(e.target.value) : null
                      )
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
                      updateFormData(
                        "secondPlacePrize",
                        e.target.value ? parseInt(e.target.value) : null
                      )
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
                      updateFormData(
                        "thirdPlacePrize",
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                  />
                </div>
              </div>
            )}
            */}

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold">Competition Rules</h3>

              <Alert>
                <AlertDescription>
                  <strong>Scoring Methodology (Coming Soon):</strong> Currently, submissions are scored using <strong>exact string matching</strong> with <strong>accuracy</strong> as the primary metric. Each response is compared to the expected output, and the score is calculated as the percentage of correct matches. Future updates will allow you to customize the scoring method (e.g., semantic similarity, custom evaluation functions, LLM-as-judge).
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="maxSubmissionsPerUser">
                  Max Submissions Per Participant*
                </Label>
                <Input
                  id="maxSubmissionsPerUser"
                  type="number"
                  min="1"
                  value={formData.maxSubmissionsPerUser}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 3;
                    updateFormData("maxSubmissionsPerUser", value);
                  }}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Maximum number of times each participant can submit (must be
                  at least 1).
                </p>
              </div>

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
                      updateFormData(
                        "minimumScore",
                        e.target.value ? parseFloat(e.target.value) : null
                      )
                    }
                    placeholder="e.g., 0.80"
                  />
                  <p className="text-sm text-muted-foreground">
                    Required minimum accuracy to qualify as winner
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
                      updateFormData(
                        "targetScore",
                        e.target.value ? parseFloat(e.target.value) : null
                      )
                    }
                    placeholder="e.g., 0.95"
                  />
                  <p className="text-sm text-muted-foreground">
                    Competition ends immediately if reached
                  </p>
                </div>
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

        {step < 3 ? (
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
  );
}

function getStepTitle(step: number): string {
  switch (step) {
    case 1:
      return "Basic Information & Data";
    case 2:
      return "Inference Requirements";
    case 3:
      return "Prizes & Completion";
    default:
      return "";
  }
}
