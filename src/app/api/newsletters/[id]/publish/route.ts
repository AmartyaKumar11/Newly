/**
 * POST /api/newsletters/:id/publish
 * 
 * Phase 3.5: Publishing System
 * 
 * Publishes a newsletter by creating an immutable snapshot.
 * 
 * Rules:
 * - Owner only (server-side validation)
 * - Creates new snapshot (never modifies existing)
 * - Validates or generates slug
 * - Marks newsletter as published
 * - Stores snapshot reference
 * 
 * Republish:
 * - Always creates a new snapshot (increments version)
 * - Never modifies existing snapshots
 * - Updates publishedSnapshotId to new snapshot
 */

import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Newsletter from "@/models/Newsletter";
import PublishedSnapshot, { calculateSnapshotHash } from "@/models/PublishedSnapshot";
import User from "@/models/User";
import { serializeBlocks } from "@/utils/blockSerialization";
import { generateSlug, generateUniqueSlug, isValidSlugFormat } from "@/utils/slugUtils";

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
    userId: user._id, // Only owner can publish
  });

  if (!newsletter) {
    return NextResponse.json({ error: "Newsletter not found or access denied" }, { status: 404 });
  }

  // Parse request body (optional slug)
  let body: { slug?: string } = {};
  try {
    body = await req.json().catch(() => ({}));
  } catch {
    // Empty body is fine, will generate slug from title
  }

  // Determine slug
  let finalSlug: string;

  if (body.slug && typeof body.slug === "string") {
    // User provided slug - validate and ensure uniqueness
    const normalizedSlug = generateSlug(body.slug);
    if (!isValidSlugFormat(normalizedSlug)) {
      return NextResponse.json({ error: "Invalid slug format" }, { status: 400 });
    }

    // Check if slug exists (excluding current newsletter if already published)
    const existingNewsletter = await Newsletter.findOne({
      slug: normalizedSlug,
      _id: { $ne: id }, // Exclude current newsletter
    });

    if (existingNewsletter) {
      return NextResponse.json(
        { error: "Slug already exists", slug: normalizedSlug },
        { status: 409 }
      );
    }

    finalSlug = normalizedSlug;
  } else {
    // Generate slug from title
    const baseSlug = newsletter.title ? generateSlug(newsletter.title) : `newsletter-${id}`;

    // Ensure uniqueness
    finalSlug = await generateUniqueSlug(baseSlug, async (slug) => {
      const exists = await Newsletter.findOne({
        slug,
        _id: { $ne: id }, // Exclude current newsletter
      });
      return !!exists;
    });
  }

  // If republishing, get next version number
  const existingSnapshots = await PublishedSnapshot.find({
    newsletterId: newsletter._id,
  })
    .sort({ snapshotVersion: -1 })
    .limit(1)
    .lean();

  const nextVersion = existingSnapshots.length > 0
    ? existingSnapshots[0].snapshotVersion + 1
    : 1;

  // Serialize blocks for snapshot (immutable)
  const serializedBlocks = serializeBlocks(newsletter.blocks || []);

  // Calculate integrity hash
  const integrityHash = calculateSnapshotHash(serializedBlocks);

  // Extract asset references from blocks (for integrity tracking)
  const assetReferences: string[] = [];
  if (Array.isArray(newsletter.blocks)) {
    for (const block of newsletter.blocks) {
      if (block.type === "image" && (block as any).src) {
        // Extract asset ID from URL if it's an asset URL
        // This is a simple extraction - may need refinement based on asset URL structure
        const src = (block as any).src;
        // Check if it's a Supabase asset URL (contains /assets/ or similar)
        // For now, we'll track all image sources as potential asset references
        if (typeof src === "string") {
          assetReferences.push(src);
        }
      }
    }
  }

  // Create immutable snapshot
  const snapshot = await PublishedSnapshot.create({
    newsletterId: newsletter._id,
    snapshotVersion: nextVersion,
    serializedBlocks,
    assetReferences,
    slug: finalSlug,
    newsletterTitle: newsletter.title,
    newsletterDescription: newsletter.description || "",
    integrityHash,
    createdBy: user._id,
  });

  // Update newsletter (mark as published, store snapshot reference)
  // IMPORTANT: This does NOT modify the draft blocks - they remain editable
  await Newsletter.findByIdAndUpdate(newsletter._id, {
    $set: {
      status: "published",
      publishedAt: new Date(),
      publishedSnapshotId: snapshot._id,
      slug: finalSlug, // Lock slug when published
    },
  });

  return NextResponse.json(
    {
      snapshot: {
        id: snapshot._id.toString(),
        version: snapshot.snapshotVersion,
        slug: snapshot.slug,
        createdAt: snapshot.createdAt,
      },
      newsletter: {
        id: newsletter._id.toString(),
        status: "published",
        publishedAt: new Date(),
        slug: finalSlug,
      },
    },
    { status: 200 }
  );
}
