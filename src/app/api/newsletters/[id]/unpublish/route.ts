/**
 * POST /api/newsletters/:id/unpublish
 * 
 * Phase 3.5: Publishing System
 * 
 * Unpublishes a newsletter by removing public visibility.
 * 
 * Rules:
 * - Owner only (server-side validation)
 * - Removes public visibility (status -> "draft")
 * - Does NOT delete snapshots (preserves history)
 * - Draft remains fully editable
 * 
 * Snapshots:
 * - All snapshots remain in database (immutable history)
 * - Can be referenced for audit/recovery
 * - Can be republished later
 */

import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Newsletter from "@/models/Newsletter";
import User from "@/models/User";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function POST(_req: NextRequest, { params }: Params) {
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
    return NextResponse.json({ error: "Invalid newsletter ID" }, { status: 400 });
  }

  // SECURITY: Verify ownership server-side (no client-side trust)
  const newsletter = await Newsletter.findOne({
    _id: id,
    userId: user._id, // Only owner can unpublish
  });

  if (!newsletter) {
    return NextResponse.json({ error: "Newsletter not found or access denied" }, { status: 404 });
  }

  // Unpublish: Change status to draft, remove publishedAt
  // IMPORTANT: Do NOT delete snapshots - they remain for history/audit
  // Slug remains (locked, but newsletter is not publicly accessible)
  await Newsletter.findByIdAndUpdate(newsletter._id, {
    $set: {
      status: "draft",
      publishedAt: null,
      // Keep publishedSnapshotId and slug for reference (can republish later)
    },
  });

  return NextResponse.json(
    {
      newsletter: {
        id: newsletter._id.toString(),
        status: "draft",
        publishedAt: null,
      },
    },
    { status: 200 }
  );
}
