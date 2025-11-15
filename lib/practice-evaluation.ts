/**
 * SERVER-ONLY MODULE
 * Practice Prompt Evaluation Engine
 * Runs submitted prompts against validation test cases and scores them.
 * Uses creator's encrypted API key for LLM calls.
 */

import "server-only";

import { prisma } from "@/lib/prisma";
import { getValidationData } from "@/firebase/firebaseadmin-storage";
import { callLLM as callLLMWithVercelAI } from "@/lib/llm";
import { decryptApiKey } from "@/lib/encryption";
import type { TestCase, EvaluationDetail } from "@/lib/types";

// Type for practice challenge (similar to Competition)
type PracticeChallenge = {
  id: string;
  modelType: string;
  validationDataUrl: string;
  encryptedApiKey: string;
  targetScore?: number | null;
  customBaseUrl?: string | null;
  customHeaders?: string | null;
};

/**
 * Evaluates a prompt submission against validation test cases for practice.
 * Runs asynchronously - updates submission status as it progresses.
 * @param submissionId - ID of practice submission to evaluate
 * @param practiceChallenge - Practice challenge details including model and validation data
 * @param prompt - User's submitted prompt to test
 */
export async function evaluatePracticePrompt(
  submissionId: string,
  practiceChallenge: PracticeChallenge,
  prompt: string
): Promise<void> {
  try {
    // Update status to evaluating
    await prisma.practiceSubmission.update({
      where: { id: submissionId },
      data: { status: "EVALUATING" },
    });

    // Load validation data from Firebase Storage using Admin SDK
    // This bypasses security rules and fetches private validation data
    const validationData = (await getValidationData(
      practiceChallenge.validationDataUrl
    )) as TestCase[];

    // Evaluate prompt against test cases
    const results = await evaluateTestCases(
      prompt,
      validationData,
      practiceChallenge.modelType,
      practiceChallenge.encryptedApiKey,
      practiceChallenge.customBaseUrl,
      practiceChallenge.customHeaders
    );

    // Calculate score (accuracy)
    const score = results.filter((r) => r.correct).length / results.length;

    // Update submission with results
    await prisma.practiceSubmission.update({
      where: { id: submissionId },
      data: {
        status: "COMPLETED",
        score, // Indexed for leaderboard queries
        evaluationLog: JSON.stringify(results), // Store test case details - users can see these for practice
        evaluatedAt: new Date(),
      },
    });

    // Update practice challenge best score if needed
    const currentPracticeChallenge = await prisma.practiceChallenge.findUnique({
      where: { id: practiceChallenge.id },
    });

    if (
      !currentPracticeChallenge?.bestScore ||
      score > currentPracticeChallenge.bestScore
    ) {
      await prisma.practiceChallenge.update({
        where: { id: practiceChallenge.id },
        data: {
          bestScore: score,
          bestSubmissionId: submissionId,
        },
      });
    }
  } catch (error) {
    console.error("Error evaluating practice prompt:", error);
    await prisma.practiceSubmission.update({
      where: { id: submissionId },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}

async function evaluateTestCases(
  prompt: string,
  testCases: TestCase[],
  modelType: string,
  encryptedApiKey?: string | null,
  customBaseUrl?: string | null,
  customHeaders?: string | null
): Promise<EvaluationDetail[]> {
  const results: EvaluationDetail[] = [];

  for (const testCase of testCases) {
    try {
      // Call the LLM with the prompt and test case input
      const output = await callLLM(
        prompt,
        testCase.input,
        modelType,
        encryptedApiKey,
        customBaseUrl,
        customHeaders
      );

      // Compare output with expected output
      const isCorrect = compareOutputs(output, testCase.expectedOutput);

      results.push({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: output,
        correct: isCorrect,
      });
    } catch (error) {
      results.push({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: null,
        correct: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}

async function callLLM(
  prompt: string,
  input: string,
  modelName: string,
  encryptedApiKey?: string | null,
  customBaseUrl?: string | null,
  customHeaders?: string | null
): Promise<string> {
  // Combine the prompt with the input
  const fullPrompt = `${prompt}\n\nInput: ${input}\n\nOutput:`;

  // Decrypt API key if provided
  let apiKey: string | undefined;
  if (encryptedApiKey) {
    try {
      apiKey = await decryptApiKey(encryptedApiKey);
    } catch (error) {
      console.error(
        "Failed to decrypt API key, falling back to environment variable:",
        error
      );
      // Fall back to environment variable if decryption fails
      apiKey = undefined;
    }
  }

  // Parse custom headers if provided
  let headers: Record<string, string> | undefined;
  if (customHeaders) {
    try {
      headers = JSON.parse(customHeaders);
    } catch (error) {
      console.warn("Failed to parse custom headers:", error);
    }
  }

  // Use the new Vercel AI SDK implementation with custom configuration
  return callLLMWithVercelAI({
    model: modelName,
    prompt: fullPrompt,
    temperature: 0,
    apiKey,
    baseURL: customBaseUrl || undefined,
    headers,
  });
}

function compareOutputs(actual: string, expected: string): boolean {
  // Normalize strings for comparison
  const normalize = (str: string) =>
    str.toLowerCase().trim().replace(/\s+/g, " ");

  return normalize(actual) === normalize(expected);
}
