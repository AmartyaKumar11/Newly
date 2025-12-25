/**
 * GET /api/shares/:token/resolve
 * 
 * Resolve a share token to newsletter data.
 * 
 * Security:
 * - Public endpoint (no authentication required for viewer access)
 * - Validates token is not revoked or expired
 * - Returns newsletter data for viewer mode
 * 
 * Access Control:
 * - Token validation only (no user authentication required)
 * - Returns newsletter if token is valid
 */

import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Newsletter from "@/models/Newsletter";
import ShareToken, { isTokenValid } from "@/models/ShareToken";

interface Params {
  params: Promise<{
    token: string;
  }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  await connectToDatabase();

  const { token } = await params;

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  // Find share token
  const shareToken = await ShareToken.findOne({ token }).lean();
  if (!shareToken) {
    return NextResponse.json({ error: "Share link not found or invalid" }, { status: 404 });
  }

  // Validate token (not revoked, not expired)
  if (!isTokenValid(shareToken)) {
    return NextResponse.json({ error: "Share link has expired or been revoked" }, { status: 410 });
  }

  // Fetch associated newsletter
  const newsletter = await Newsletter.findById(shareToken.newsletterId).lean();
  if (!newsletter) {
    return NextResponse.json({ error: "Newsletter not found" }, { status: 404 });
  }

  // Return newsletter data with share token info
  return NextResponse.json(
    {
      newsletter: {
        _id: newsletter._id.toString(),
        title: newsletter.title,
        description: newsletter.description,
        blocks: newsletter.blocks,
        structureJSON: newsletter.structureJSON,
        createdAt: newsletter.createdAt,
        updatedAt: newsletter.updatedAt,
      },
      shareToken: {
        role: shareToken.role,
        expiresAt: shareToken.expiresAt,
      },
    },
    { status: 200 }
  );
}
