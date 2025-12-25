/**
 * /p/[slug] - Public Published Newsletter Route
 * 
 * Phase 3.5: Publishing System
 * 
 * Public consumption route for published newsletters.
 * 
 * Rules:
 * - No authentication required
 * - No editor code
 * - No editor stores
 * - No autosave
 * - No undo/redo
 * - No AI
 * - No mutation paths
 * - Deterministic, read-only rendering only
 * 
 * SEO:
 * - Indexable (published content)
 * - Canonical URLs
 * - Open Graph metadata
 */

import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import PublishedSnapshot from "@/models/PublishedSnapshot";
import { PublicNewsletterRenderer } from "@/components/public/PublicNewsletterRenderer";
import type { Metadata } from "next";

interface PublicPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Force dynamic rendering - published content is dynamic
export const dynamic = "force-dynamic";

/**
 * Generate metadata for SEO and Open Graph.
 */
export async function generateMetadata({ params }: PublicPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    await connectToDatabase();

    // Find the latest snapshot with this slug
    const snapshot = await PublishedSnapshot.findOne({ slug })
      .sort({ createdAt: -1 })
      .lean();

    if (!snapshot) {
      return {
        title: "Newsletter Not Found",
      };
    }

    const baseUrl = process.env.NEXTAUTH_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const canonicalUrl = `${baseUrl}/p/${slug}`;

    return {
      title: snapshot.newsletterTitle || "Newsletter",
      description: snapshot.newsletterDescription || "",
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: snapshot.newsletterTitle || "Newsletter",
        description: snapshot.newsletterDescription || "",
        url: canonicalUrl,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: snapshot.newsletterTitle || "Newsletter",
        description: snapshot.newsletterDescription || "",
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  } catch (error) {
    console.error("Failed to generate metadata:", error);
    return {
      title: "Newsletter",
    };
  }
}

export default async function PublicPage({ params }: PublicPageProps) {
  const { slug } = await params;

  if (!slug || typeof slug !== "string") {
    notFound();
  }

  try {
    await connectToDatabase();

    // Find the latest snapshot with this slug
    // If multiple snapshots exist (republished), use the most recent one
    const snapshot = await PublishedSnapshot.findOne({ slug })
      .sort({ createdAt: -1 })
      .lean();

    if (!snapshot) {
      notFound();
    }

    // Deserialize blocks from snapshot (already in correct format)
    const blocks = snapshot.serializedBlocks || [];

    return (
      <PublicNewsletterRenderer
        blocks={blocks}
        title={snapshot.newsletterTitle}
        description={snapshot.newsletterDescription}
      />
    );
  } catch (error) {
    console.error("Failed to load published newsletter:", error);
    notFound();
  }
}
