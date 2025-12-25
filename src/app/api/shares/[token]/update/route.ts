/**
 * POST /api/shares/:token/update
 * 
 * Update newsletter content via share token (editor role only).
 * 
 * Security:
 * - Validates share token (not revoked, not expired)
 * - Only allows updates if token role is "editor"
 * - Does not allow ownership actions (share, publish)
 * 
 * Access Control:
 * - Token must be valid and not expired
 * - Token role must be "editor" (viewers cannot update)
 * - Updates newsletter blocks and structureJSON only
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

export async function POST(req: NextRequest, { params }: Params) {
  await connectToDatabase();

  const { token } = await params;

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  // Find and validate share token
  const shareToken = await ShareToken.findOne({ token }).lean();
  if (!shareToken) {
    return NextResponse.json({ error: "Share link not found or invalid" }, { status: 404 });
  }

  // Validate token (not revoked, not expired)
  if (!isTokenValid(shareToken)) {
    return NextResponse.json({ error: "Share link has expired or been revoked" }, { status: 410 });
  }

  // SECURITY: Only editors can update (viewers are read-only)
  if (shareToken.role !== "editor") {
    return NextResponse.json({ error: "Viewer access is read-only" }, { status: 403 });
  }

  // Parse request body
  let body: { blocks?: unknown[]; structureJSON?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.blocks || !Array.isArray(body.blocks)) {
    return NextResponse.json({ error: "Blocks array is required" }, { status: 400 });
  }

  // Fetch newsletter
  const newsletter = await Newsletter.findById(shareToken.newsletterId);
  if (!newsletter) {
    return NextResponse.json({ error: "Newsletter not found" }, { status: 404 });
  }

  // Update newsletter (editor can modify content)
  // SECURITY: Only update blocks and structureJSON - no ownership fields
  newsletter.blocks = body.blocks;
  newsletter.structureJSON = body.structureJSON || {};
  newsletter.updatedAt = new Date();
  newsletter.lastAutosave = new Date();
  
  await newsletter.save();

  return NextResponse.json(
    {
      updated: {
        _id: newsletter._id.toString(),
        title: newsletter.title,
        blocks: newsletter.blocks,
        structureJSON: newsletter.structureJSON,
        updatedAt: newsletter.updatedAt,
        lastAutosave: newsletter.lastAutosave,
      },
    },
    { status: 200 }
  );
}
