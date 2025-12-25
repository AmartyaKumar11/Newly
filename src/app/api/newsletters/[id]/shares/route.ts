/**
 * GET /api/newsletters/:id/shares
 * 
 * List all active (non-revoked, non-expired) share tokens for a newsletter.
 * 
 * Security:
 * - Only newsletter owner can list share tokens
 * - Ownership validated server-side
 * - Never returns revoked or expired tokens
 * 
 * Access Control:
 * - Server-side ownership check (no client-side trust)
 */

import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Newsletter from "@/models/Newsletter";
import User from "@/models/User";
import ShareToken, { isTokenValid } from "@/models/ShareToken";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function GET(_req: NextRequest, { params }: Params) {
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
    userId: user._id, // Only owner can list shares
  });

  if (!newsletter) {
    return NextResponse.json({ error: "Newsletter not found or access denied" }, { status: 404 });
  }

  // Fetch all share tokens for this newsletter
  const shareTokens = await ShareToken.find({
    newsletterId: newsletter._id,
  }).lean();

  // Filter to only valid (non-revoked, non-expired) tokens
  const validTokens = shareTokens
    .filter((token) => isTokenValid(token))
    .map((token) => ({
      token: token.token,
      role: token.role,
      expiresAt: token.expiresAt,
      createdAt: token.createdAt,
    }));

  return NextResponse.json({ shares: validTokens }, { status: 200 });
}
