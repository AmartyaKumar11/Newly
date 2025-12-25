/**
 * DELETE /api/shares/:token
 * 
 * Revoke a share token.
 * 
 * Security:
 * - Only newsletter owner can revoke share tokens
 * - Ownership validated server-side via ShareToken -> Newsletter -> User
 * - Soft delete (sets revoked flag, keeps audit trail)
 * 
 * Access Control:
 * - Server-side ownership check (no client-side trust)
 */

import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Newsletter from "@/models/Newsletter";
import User from "@/models/User";
import ShareToken from "@/models/ShareToken";

interface Params {
  params: Promise<{
    token: string;
  }>;
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  await connectToDatabase();

  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { token } = await params;

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  // Find share token
  const shareToken = await ShareToken.findOne({ token }).lean();
  if (!shareToken) {
    return NextResponse.json({ error: "Share token not found" }, { status: 404 });
  }

  // SECURITY: Verify ownership server-side (no client-side trust)
  // Check if user owns the newsletter associated with this token
  const newsletter = await Newsletter.findOne({
    _id: shareToken.newsletterId,
    userId: user._id, // Only owner can revoke shares
  });

  if (!newsletter) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Soft delete: set revoked flag (keeps audit trail)
  await ShareToken.updateOne(
    { token },
    { $set: { revoked: true } }
  );

  return NextResponse.json({ ok: true }, { status: 200 });
}
