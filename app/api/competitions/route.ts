import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CompetitionStatus } from "@prisma/client";
import { encryptApiKey, getProviderFromModel } from "@/lib/encryption";
import { updateExpiredCompetitions } from "@/lib/utils";

/**
 * GET /api/competitions
 * Returns all competitions with submission counts and organizer info.
 * Supports optional ?status=ACTIVE filter.
 */
export async function GET(req: Request) {
  try {
    // Update expired competitions before fetching
    await updateExpiredCompetitions();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where = status ? { status: status as CompetitionStatus } : {};

    const competitions = await prisma.competition.findMany({
      where,
      include: {
        organizer: {
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

    return NextResponse.json(competitions);
  } catch (error) {
    console.error("Error fetching competitions:", error);
    return NextResponse.json(
      { error: "Failed to fetch competitions" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/competitions
 * Creates a new competition. Validates prizes, encrypts API key, uploads data files.
 * Requires authentication. Sets competition status to ACTIVE.
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

    // Validate prize amounts
    if (data.totalPrize < 0) {
      return NextResponse.json(
        { error: "Total prize cannot be negative" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(data.totalPrize)) {
      return NextResponse.json(
        { error: "Total prize must be a whole dollar amount" },
        { status: 400 }
      );
    }

    if (data.firstPlacePrize && !Number.isInteger(data.firstPlacePrize)) {
      return NextResponse.json(
        { error: "Prize amounts must be whole dollar amounts" },
        { status: 400 }
      );
    }

    if (data.secondPlacePrize && !Number.isInteger(data.secondPlacePrize)) {
      return NextResponse.json(
        { error: "Prize amounts must be whole dollar amounts" },
        { status: 400 }
      );
    }

    if (data.thirdPlacePrize && !Number.isInteger(data.thirdPlacePrize)) {
      return NextResponse.json(
        { error: "Prize amounts must be whole dollar amounts" },
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

    // Create competition
    const competition = await prisma.competition.create({
      data: {
        title: data.title,
        description: data.description,
        organizationName: data.organizationName,
        totalPrize: data.totalPrize,
        firstPlacePrize: data.firstPlacePrize,
        secondPlacePrize: data.secondPlacePrize,
        thirdPlacePrize: data.thirdPlacePrize,
        prizeDistribution: data.prizeDistribution,
        minimumScore: data.minimumScore,
        targetScore: data.targetScore,
        examplePrompt: data.examplePrompt,
        characterLimit: data.characterLimit,
        tokenLimit: data.tokenLimit,
        modelType: data.modelType,
        trainingDataUrl: data.trainingDataUrl,
        validationDataUrl: data.validationDataUrl,
        trainingDataSize: data.trainingDataSize,
        validationDataSize: data.validationDataSize,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        organizerId: auth.user.id,
        status: "ACTIVE",
        encryptedApiKey,
        apiKeyProvider,
      },
    });

    // Don't return encrypted API key to client
    const {
      encryptedApiKey: _,
      apiKeyProvider: __,
      ...safeCompetition
    } = competition;
    return NextResponse.json(safeCompetition, { status: 201 });
  } catch (error) {
    console.error("Error creating competition:", error);
    return NextResponse.json(
      { error: "Failed to create competition" },
      { status: 500 }
    );
  }
}
