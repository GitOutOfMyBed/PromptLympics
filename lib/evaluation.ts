/**
 * Prompt Evaluation Engine
 * Runs submitted prompts against validation test cases and scores them.
 * Uses organizer's encrypted API key for LLM calls.
 */

import { prisma } from "@/lib/prisma"
import { getValidationData } from "@/firebase/firebaseadmin-storage"
import { callLLM as callLLMWithVercelAI } from "@/lib/llm"
import { decryptApiKey } from "@/lib/encryption"
import type { Competition, TestCase } from "@/lib/types"

/**
 * Evaluates a prompt submission against validation test cases.
 * Runs asynchronously - updates submission status as it progresses.
 * @param submissionId - ID of submission to evaluate
 * @param competition - Competition details including model and validation data
 * @param prompt - User's submitted prompt to test
 */
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

    // Load validation data from Firebase Storage using Admin SDK
    // This bypasses security rules and fetches private validation data
    const validationData = await getValidationData(competition.validationDataUrl) as TestCase[]

    // Evaluate prompt against test cases
    const results = await evaluateTestCases(
      prompt,
      validationData,
      competition.modelType,
      competition.encryptedApiKey
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
  modelType: string,
  encryptedApiKey?: string | null
): Promise<{ correct: number; total: number; details: any[] }> {
  let correct = 0
  const details: any[] = []

  for (const testCase of testCases) {
    try {
      // Call the LLM with the prompt and test case input
      const output = await callLLM(prompt, testCase.input, modelType, encryptedApiKey)

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
  modelName: string,
  encryptedApiKey?: string | null
): Promise<string> {
  // Combine the prompt with the input
  const fullPrompt = `${prompt}\n\nInput: ${input}\n\nOutput:`

  // Decrypt API key if provided
  let apiKey: string | undefined
  if (encryptedApiKey) {
    try {
      apiKey = await decryptApiKey(encryptedApiKey)
    } catch (error) {
      console.error("Failed to decrypt API key, falling back to environment variable:", error)
      // Fall back to environment variable if decryption fails
      apiKey = undefined
    }
  }

  // Use the new Vercel AI SDK implementation with optional custom API key
  return callLLMWithVercelAI({
    model: modelName,
    prompt: fullPrompt,
    temperature: 0,
    apiKey,  // Will use env var if undefined
  })
}

function compareOutputs(actual: string, expected: string): boolean {
  // Normalize strings for comparison
  const normalize = (str: string) =>
    str.toLowerCase().trim().replace(/\s+/g, " ")

  return normalize(actual) === normalize(expected)
}
