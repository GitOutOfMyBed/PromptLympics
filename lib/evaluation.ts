/**
 * SERVER-ONLY MODULE
 * Prompt Evaluation Engine
 * Runs submitted prompts against validation test cases and scores them.
 * Uses organizer's encrypted API key for LLM calls.
 */

import "server-only";

import { prisma } from "@/lib/prisma";
import { getValidationData } from "@/firebase/firebaseadmin-storage";
import { callLLM } from "@/lib/llm";
import { decryptApiKey } from "@/lib/encryption";
import type { Competition, TestCase, EvaluationDetail } from "@/lib/types";

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
  console.log(
    `[Evaluation] Starting evaluation for submission ${submissionId}`
  );
  try {
    // Update status to evaluating
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: "EVALUATING" },
    });
    console.log(
      `[Evaluation] Updated submission ${submissionId} to EVALUATING`
    );

    // Load validation data from Firebase Storage using Admin SDK
    // This bypasses security rules and fetches private validation data
    console.log(
      `[Evaluation] Loading validation data from ${competition.validationDataUrl}`
    );
    const validationData = (await getValidationData(
      competition.validationDataUrl
    )) as TestCase[];
    console.log(`[Evaluation] Loaded ${validationData.length} test cases`);

    // Evaluate prompt against test cases
    const results = await evaluateTestCases(
      prompt,
      validationData,
      competition.modelType,
      competition.encryptedApiKey
    );

    // Calculate score (accuracy)
    const score = results.filter((r) => r.correct).length / results.length;

    // Update submission with results
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: "COMPLETED",
        score, // Indexed for leaderboard queries
        evaluationLog: JSON.stringify(results), // Store only test case details
        evaluatedAt: new Date(),
      },
    });

    // Update competition best score if needed
    const currentCompetition = await prisma.competition.findUnique({
      where: { id: competition.id },
    });

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
      });
    }

    // Check if target score reached (competition should end)
    if (competition.targetScore && score >= competition.targetScore) {
      await prisma.competition.update({
        where: { id: competition.id },
        data: { status: "COMPLETED" },
      });
    }
  } catch (error) {
    console.error("Error evaluating prompt:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.log(
      `[Evaluation] Updating submission ${submissionId} to FAILED with error:`,
      errorMessage
    );

    try {
      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          status: "FAILED",
          errorMessage,
        },
      });
      console.log(
        `[Evaluation] Successfully updated submission ${submissionId} to FAILED`
      );
    } catch (updateError) {
      console.error(
        `[Evaluation] CRITICAL: Failed to update submission ${submissionId} to FAILED:`,
        updateError
      );
      throw updateError; // Re-throw so it's visible in the API error handler
    }
  }
}

async function evaluateTestCases(
  prompt: string,
  testCases: TestCase[],
  modelType: string,
  encryptedApiKey: string
): Promise<EvaluationDetail[]> {
  const results: EvaluationDetail[] = [];

  // Decrypt API key if provided
  let apiKey: string;
  try {
    apiKey = await decryptApiKey(encryptedApiKey);
  } catch (error) {
    throw new Error("Failed to decrypt API key");
  }

  for (const testCase of testCases) {
    // Call the LLM with the prompt and test case input
    // If this throws an error, let it propagate to fail the evaluation
    const fullPrompt = `${prompt}\n\nInput: ${testCase.input}\n\nOutput:`;

    // Use the new Vercel AI SDK implementation with optional custom API key
    const output = await callLLM({
      model: modelType,
      prompt: fullPrompt,
      temperature: 0,
      apiKey, // Will use env var if undefined
    });
    // Compare output with expected output
    const isCorrect = compareOutputs(output, testCase.expectedOutput);

    results.push({
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      actualOutput: output,
      correct: isCorrect,
    });
  }

  return results;
}

function compareOutputs(actual: string, expected: string): boolean {
  // Normalize strings for comparison
  const normalize = (str: string) =>
    str.toLowerCase().trim().replace(/\s+/g, " ");

  return normalize(actual) === normalize(expected);
}
