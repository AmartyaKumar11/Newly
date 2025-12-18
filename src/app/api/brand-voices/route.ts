import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import BrandVoice from "@/models/BrandVoice";
import User from "@/models/User";

/**
 * Brand Voice API - Phase 3.3.3 Part B
 * 
 * GET: List all brand voices for the authenticated user
 * POST: Create a new brand voice
 */

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all non-deleted brand voices for this user
    const brandVoices = await BrandVoice.find({
      userId: user._id,
      deleted: false,
    }).sort({ createdAt: -1 });

    return NextResponse.json({ brandVoices });
  } catch (error) {
    console.error("Failed to fetch brand voices:", error);
    return NextResponse.json(
      { error: "Failed to fetch brand voices" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();

    // Validate required fields
    if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: "Brand voice name is required" },
        { status: 400 }
      );
    }

    // If this is set as default, unset other defaults for this user
    if (body.isDefault) {
      await BrandVoice.updateMany(
        { userId: user._id, deleted: false },
        { $set: { isDefault: false } }
      );
    }

    // Create new brand voice
    const brandVoice = new BrandVoice({
      userId: user._id,
      name: body.name.trim(),
      description: body.description || "",
      tone: body.tone || {
        primary: "professional",
        secondary: [],
        description: "",
      },
      style: body.style || {
        sentenceLength: "medium",
        paragraphLength: "medium",
        voice: "third-person",
        formality: "neutral",
        notes: "",
      },
      vocabulary: body.vocabulary || {
        preferred: [],
        avoided: [],
        terminology: [],
        notes: "",
      },
      rules: body.rules || {
        do: [],
        dont: [],
      },
      examples: body.examples || {
        good: [],
        bad: [],
      },
      isDefault: body.isDefault || false,
      version: 1,
    });

    await brandVoice.save();

    return NextResponse.json({ brandVoice }, { status: 201 });
  } catch (error) {
    console.error("Failed to create brand voice:", error);
    return NextResponse.json(
      { error: "Failed to create brand voice" },
      { status: 500 }
    );
  }
}


