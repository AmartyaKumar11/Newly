/**
 * /share/[token] - Public share link route
 * 
 * Resolves a share token and renders the newsletter in viewer mode.
 * 
 * Security:
 * - No authentication required (public access)
 * - Token validation happens server-side
 * - Viewer mode enforced (no mutations allowed)
 * 
 * Access Control:
 * - Validates token exists, not revoked, not expired
 * - Loads newsletter in read-only viewer mode
 * - No autosave, undo, AI, or mutations
 */

import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import Newsletter from "@/models/Newsletter";
import ShareToken, { isTokenValid } from "@/models/ShareToken";
import { EditorLayout } from "@/components/editor/EditorLayout";

interface SharePageProps {
  params: Promise<{
    token: string;
  }>;
}

// Force dynamic rendering - share links are dynamic
export const dynamic = "force-dynamic";

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;

  if (!token || typeof token !== "string") {
    notFound();
  }

  // SECURITY: Resolve token server-side (no client-side trust)
  // This validates token exists, is not revoked, and is not expired
  try {
    await connectToDatabase();

    // Find share token
    const shareToken = await ShareToken.findOne({ token }).lean();
    if (!shareToken) {
      notFound(); // Token not found
    }

    // Validate token (not revoked, not expired)
    if (!isTokenValid(shareToken)) {
      notFound(); // Token expired or revoked
    }

    // Fetch associated newsletter
    const newsletter = await Newsletter.findById(shareToken.newsletterId).lean();
    if (!newsletter) {
      notFound(); // Newsletter not found
    }

    const newsletterId = newsletter._id.toString();

    // Prepare newsletter data for EditorLayout
    // SECURITY: Only pass safe, serializable data (no internal MongoDB fields)
    const newsletterData = {
      _id: newsletter._id.toString(),
      title: newsletter.title,
      description: newsletter.description,
      status: newsletter.status,
      blocks: newsletter.blocks || [],
      structureJSON: newsletter.structureJSON || {},
      createdAt: newsletter.createdAt,
      updatedAt: newsletter.updatedAt,
    };

    // Determine editor mode based on share token role
    // SECURITY: Role is authoritative and comes from server-side token validation
    // - "viewer" role = read-only mode (no mutations)
    // - "editor" role = edit mode (can modify content, but no admin actions)
    const editorMode = shareToken.role === "editor" ? "edit" : "view";
    
    // Render editor with role-appropriate mode
    // VIEWER MODE ENFORCEMENT (role === "viewer"):
    // - No block selection, dragging, or resizing
    // - No keyboard shortcuts (delete, undo, redo)
    // - No autosave (blocks never marked dirty)
    // - No AI panels or uploads
    // - No property panels
    // - Blocks render normally but are read-only
    //
    // EDITOR MODE (role === "editor"):
    // - Can select, drag, resize blocks
    // - Can use keyboard shortcuts
    // - Autosave enabled (uses share token endpoint)
    // - AI panels and uploads enabled
    // - Property panels enabled
    // - BUT: Cannot access share modal or publish (owner-only features)
    // SECURITY: isOwner=false ensures share link users (viewer or editor) cannot access owner-only features
    // Pass shareToken for editor role to enable autosave via share token endpoint
    return (
      <EditorLayout 
        newsletterId={newsletterId} 
        editorMode={editorMode} 
        initialNewsletter={newsletterData} 
        isOwner={false}
        shareToken={shareToken.role === "editor" ? token : null}
      />
    );
  } catch (error) {
    console.error("Failed to resolve share token:", error);
    notFound();
  }
}
