/**
 * POST /api/newsletters/:id/share
 * 
 * Create a share token for a newsletter.
 * 
 * Security:
 * - Only newsletter owner can create share tokens
 * - Ownership validated server-side
 * - Token is cryptographically secure and URL-safe
 * 
 * Access Control:
 * - Server-side ownership check (no client-side trust)
 * - Default role is "viewer" (v1)
 * - Editor role defined but not behaviorally enabled yet
 */

import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Newsletter from "@/models/Newsletter";
import User from "@/models/User";
import ShareToken, { generateShareToken, isTokenValid } from "@/models/ShareToken";
import type { AccessRole } from "@/types/access";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function POST(req: NextRequest, { params }: Params) {
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
    userId: user._id, // Only owner can create shares
  });

  if (!newsletter) {
    return NextResponse.json({ error: "Newsletter not found or access denied" }, { status: 404 });
  }

  // Parse request body (optional role, default to "viewer")
  let body: { role?: AccessRole; expiresAt?: string | null } = {};
  try {
    body = await req.json().catch(() => ({}));
  } catch {
    // Empty body is fine, use defaults
  }

  const role: AccessRole = body.role === "editor" ? "editor" : "viewer"; // v1: default to viewer
  const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

  // Generate secure, URL-safe token
  const token = generateShareToken();

  // Create share token
  const shareToken = await ShareToken.create({
    token,
    newsletterId: newsletter._id,
    role,
    createdBy: user._id,
    revoked: false,
    expiresAt,
  });

  return NextResponse.json(
    {
      token: shareToken.token,
      role: shareToken.role,
      expiresAt: shareToken.expiresAt,
      createdAt: shareToken.createdAt,
    },
    { status: 201 }
  );
}
