import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import mongoose from "mongoose";
import BrandVoice from "@/models/BrandVoice";
import User from "@/models/User";

/**
 * Brand Voice Detail API - Phase 3.3.3 Part B
 * 
 * GET: Get specific brand voice
 * PATCH: Update brand voice
 * DELETE: Soft delete brand voice
 */

interface Params {
  params: Promise<{
    id: string;
  }>;
}

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function GET(_req: NextRequest, { params }: Params) {
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

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid brand voice ID" }, { status: 400 });
    }

    const brandVoice = await BrandVoice.findOne({
      _id: id,
      userId: user._id,
      deleted: false,
    });

    if (!brandVoice) {
      return NextResponse.json({ error: "Brand voice not found" }, { status: 404 });
    }

    return NextResponse.json({ brandVoice });
  } catch (error) {
    console.error("Failed to fetch brand voice:", error);
    return NextResponse.json(
      { error: "Failed to fetch brand voice" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
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

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid brand voice ID" }, { status: 400 });
    }

    const body = await req.json();

    // Find existing brand voice
    const brandVoice = await BrandVoice.findOne({
      _id: id,
      userId: user._id,
      deleted: false,
    });

    if (!brandVoice) {
      return NextResponse.json({ error: "Brand voice not found" }, { status: 404 });
    }

    // If setting as default, unset other defaults
    if (body.isDefault === true) {
      await BrandVoice.updateMany(
        { userId: user._id, _id: { $ne: id }, deleted: false },
        { $set: { isDefault: false } }
      );
    }

    // Update fields (only update provided fields)
    if (body.name !== undefined) {
      brandVoice.name = body.name.trim();
    }
    if (body.description !== undefined) {
      brandVoice.description = body.description;
    }
    if (body.tone !== undefined) {
      brandVoice.tone = { ...brandVoice.tone, ...body.tone };
    }
    if (body.style !== undefined) {
      brandVoice.style = { ...brandVoice.style, ...body.style };
    }
    if (body.vocabulary !== undefined) {
      brandVoice.vocabulary = { ...brandVoice.vocabulary, ...body.vocabulary };
    }
    if (body.rules !== undefined) {
      brandVoice.rules = { ...brandVoice.rules, ...body.rules };
    }
    if (body.examples !== undefined) {
      brandVoice.examples = { ...brandVoice.examples, ...body.examples };
    }
    if (body.isDefault !== undefined) {
      brandVoice.isDefault = body.isDefault;
    }
    if (body.version !== undefined) {
      brandVoice.version = body.version;
    }

    await brandVoice.save();

    return NextResponse.json({ brandVoice });
  } catch (error) {
    console.error("Failed to update brand voice:", error);
    return NextResponse.json(
      { error: "Failed to update brand voice" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
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

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid brand voice ID" }, { status: 400 });
    }

    // Soft delete
    const brandVoice = await BrandVoice.findOneAndUpdate(
      { _id: id, userId: user._id, deleted: false },
      {
        $set: {
          deleted: true,
          deletedAt: new Date(),
          isDefault: false, // Can't be default if deleted
        },
      },
      { new: true }
    );

    if (!brandVoice) {
      return NextResponse.json({ error: "Brand voice not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete brand voice:", error);
    return NextResponse.json(
      { error: "Failed to delete brand voice" },
      { status: 500 }
    );
  }
}
