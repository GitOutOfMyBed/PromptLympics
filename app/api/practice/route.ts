import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptApiKey, getProviderFromModel } from "@/lib/encryption";

/**
 * GET /api/practice
 * Returns all practice challenges with submission counts and creator info.
 */
export async function GET(req: Request) {
  try {
    const practiceChallenges = await prisma.practiceChallenge.findMany({
      include: {
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(practiceChallenges);
  } catch (error) {
    console.error("Error fetching practice challenges:", error);
    return NextResponse.json(
      { error: "Failed to fetch practice challenges" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/practice
 * Creates a new practice challenge. Validates data, encrypts API key.
 * Requires authentication.
 */
export async function POST(req: Request) {
  try {
    const auth = await verifyAuth(req);

    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    // Validate required fields
    if (
      !data.title ||
      !data.description ||
      !data.organizationName ||
      !data.apiKey
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Handle API key encryption (always required)
    let encryptedApiKey = null;
    let apiKeyProvider = null;

    try {
      // Encrypt the API key
      encryptedApiKey = await encryptApiKey(data.apiKey);

      // Determine provider based on model
      apiKeyProvider = getProviderFromModel(data.modelType);
    } catch (error) {
      console.error("Error encrypting API key:", error);
      return NextResponse.json(
        {
          error:
            "Failed to encrypt API key. Please check your encryption configuration.",
        },
        { status: 500 }
      );
    }

    // Create practice challenge
    const practiceChallenge = await prisma.practiceChallenge.create({
      data: {
        title: data.title,
        description: data.description,
        organizationName: data.organizationName,
        minimumScore: data.minimumScore,
        targetScore: data.targetScore,
        starterPrompt: data.starterPrompt,
        characterLimit: data.characterLimit,
        tokenLimit: data.tokenLimit,
        modelType: data.modelType,
        trainingDataUrl: data.trainingDataUrl,
        validationDataUrl: data.validationDataUrl,
        trainingDataSize: data.trainingDataSize,
        validationDataSize: data.validationDataSize,
        creatorId: auth.user.id,
        encryptedApiKey,
        apiKeyProvider,
        maxSubmissionsPerUser: data.maxSubmissionsPerUser || 999,
      },
    });

    // Don't return encrypted API key to client
    const {
      encryptedApiKey: _,
      apiKeyProvider: __,
      ...safePracticeChallenge
    } = practiceChallenge;
    return NextResponse.json(safePracticeChallenge, { status: 201 });
  } catch (error) {
    console.error("Error creating practice challenge:", error);
    return NextResponse.json(
      { error: "Failed to create practice challenge" },
      { status: 500 }
    );
  }
}
