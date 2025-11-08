import { prisma } from "@/lib/prisma"
import { readFile } from "fs/promises"
import { join } from "path"

type Competition = {
  id: string
  modelType: string
  validationDataUrl: string
  targetScore: number | null
  organizerId: string
}

type TestCase = {
  input: string
  expectedOutput: string
}

export async function evaluatePrompt(
  submissionId: string,
  competition: Competition,
  prompt: string
): Promise<void> {
  try {
    // Update status to evaluating
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: "EVALUATING" },
    })

    // Load validation data
    const validationPath = join(
      process.cwd(),
      "public",
      competition.validationDataUrl
    )
    const validationData = JSON.parse(
      await readFile(validationPath, "utf-8")
    ) as TestCase[]

    // Evaluate prompt against test cases
    const results = await evaluateTestCases(
      prompt,
      validationData,
      competition.modelType
    )

    // Calculate score (accuracy)
    const score = results.correct / results.total

    // Update submission with results
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: "COMPLETED",
        score,
        accuracy: score,
        evaluationLog: JSON.stringify(results.details),
        evaluatedAt: new Date(),
      },
    })

    // Update competition best score if needed
    const currentCompetition = await prisma.competition.findUnique({
      where: { id: competition.id },
    })

    if (
      !currentCompetition?.bestScore ||
      score > currentCompetition.bestScore
    ) {
      await prisma.competition.update({
        where: { id: competition.id },
        data: {
          bestScore: score,
          bestSubmissionId: submissionId,
        },
      })
    }

    // Check if target score reached (competition should end)
    if (competition.targetScore && score >= competition.targetScore) {
      await prisma.competition.update({
        where: { id: competition.id },
        data: { status: "COMPLETED" },
      })
    }
  } catch (error) {
    console.error("Error evaluating prompt:", error)
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    })
  }
}

async function evaluateTestCases(
  prompt: string,
  testCases: TestCase[],
  modelType: string
): Promise<{ correct: number; total: number; details: any[] }> {
  let correct = 0
  const details: any[] = []

  for (const testCase of testCases) {
    try {
      // Call the LLM with the prompt and test case input
      const output = await callLLM(prompt, testCase.input, modelType)

      // Compare output with expected output
      const isCorrect = compareOutputs(output, testCase.expectedOutput)

      if (isCorrect) {
        correct++
      }

      details.push({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: output,
        correct: isCorrect,
      })
    } catch (error) {
      details.push({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: null,
        correct: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  return {
    correct,
    total: testCases.length,
    details,
  }
}

async function callLLM(
  prompt: string,
  input: string,
  modelType: string
): Promise<string> {
  // Combine the prompt with the input
  const fullPrompt = `${prompt}\n\nInput: ${input}\n\nOutput:`

  // Call the appropriate LLM based on modelType
  if (modelType.startsWith("GPT")) {
    return callOpenAI(fullPrompt, modelType)
  } else if (modelType.startsWith("CLAUDE")) {
    return callAnthropic(fullPrompt, modelType)
  } else {
    throw new Error(`Unsupported model type: ${modelType}`)
  }
}

async function callOpenAI(prompt: string, modelType: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error("OpenAI API key not configured")
  }

  const modelMap: Record<string, string> = {
    GPT_4: "gpt-4",
    GPT_3_5_TURBO: "gpt-3.5-turbo",
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelMap[modelType] || "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 500,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.choices[0].message.content.trim()
}

async function callAnthropic(
  prompt: string,
  modelType: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    throw new Error("Anthropic API key not configured")
  }

  const modelMap: Record<string, string> = {
    CLAUDE_3_OPUS: "claude-3-opus-20240229",
    CLAUDE_3_SONNET: "claude-3-sonnet-20240229",
    CLAUDE_3_HAIKU: "claude-3-haiku-20240307",
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: modelMap[modelType] || "claude-3-haiku-20240307",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    }),
  })

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.content[0].text.trim()
}

function compareOutputs(actual: string, expected: string): boolean {
  // Normalize strings for comparison
  const normalize = (str: string) =>
    str.toLowerCase().trim().replace(/\s+/g, " ")

  return normalize(actual) === normalize(expected)
}
