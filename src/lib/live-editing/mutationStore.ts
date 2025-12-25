/**
 * Server-Side Mutation Store
 * 
 * Phase 4.1: Live Editing
 * 
 * In-memory store for tracking document versions and pending mutations.
 * 
 * This store is ephemeral and resets on server restart.
 * Authoritative state lives in MongoDB (via autosave).
 */

import type { Mutation, DocumentVersion } from "@/types/mutations";

/**
 * Document version tracking (in-memory)
 */
const documentVersions = new Map<string, DocumentVersion>();

/**
 * Pending mutations queue (for conflict resolution)
 */
const pendingMutations = new Map<string, Mutation[]>();

/**
 * Get or initialize document version
 */
export function getDocumentVersion(newsletterId: string): DocumentVersion {
  if (!documentVersions.has(newsletterId)) {
    documentVersions.set(newsletterId, {
      newsletterId,
      version: 0,
      lastMutationId: null,
      lastMutationTimestamp: 0,
    });
  }
  return documentVersions.get(newsletterId)!;
}

/**
 * Increment document version
 */
export function incrementDocumentVersion(newsletterId: string, mutationId: string): number {
  const version = getDocumentVersion(newsletterId);
  version.version += 1;
  version.lastMutationId = mutationId;
  version.lastMutationTimestamp = Date.now();
  return version.version;
}

/**
 * Initialize document version from database
 * Called when a newsletter is loaded
 */
export function initializeDocumentVersion(newsletterId: string, initialVersion?: number): void {
  const version = getDocumentVersion(newsletterId);
  if (initialVersion !== undefined) {
    version.version = initialVersion;
  }
  // Clear pending mutations on initialization
  pendingMutations.delete(newsletterId);
}

/**
 * Add pending mutation
 */
export function addPendingMutation(newsletterId: string, mutation: Mutation): void {
  if (!pendingMutations.has(newsletterId)) {
    pendingMutations.set(newsletterId, []);
  }
  pendingMutations.get(newsletterId)!.push(mutation);
}

/**
 * Get pending mutations for a newsletter
 */
export function getPendingMutations(newsletterId: string): Mutation[] {
  return pendingMutations.get(newsletterId) || [];
}

/**
 * Clear pending mutations
 */
export function clearPendingMutations(newsletterId: string): void {
  pendingMutations.delete(newsletterId);
}

/**
 * Remove a specific pending mutation
 */
export function removePendingMutation(newsletterId: string, mutationId: string): void {
  const pending = pendingMutations.get(newsletterId);
  if (pending) {
    const index = pending.findIndex((m) => m.mutationId === mutationId);
    if (index !== -1) {
      pending.splice(index, 1);
    }
  }
}

/**
 * Cleanup old document versions (call periodically)
 */
export function cleanupOldVersions(maxAgeMs: number = 30 * 60 * 1000): void {
  const now = Date.now();
  for (const [newsletterId, version] of documentVersions.entries()) {
    if (now - version.lastMutationTimestamp > maxAgeMs) {
      documentVersions.delete(newsletterId);
      pendingMutations.delete(newsletterId);
    }
  }
}
