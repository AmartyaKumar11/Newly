"use client";

import { useState, useEffect } from "react";
import type { AccessRole } from "@/types/access";

interface ShareToken {
  token: string;
  role: AccessRole;
  expiresAt: Date | null;
  createdAt: Date;
}

interface ShareModalProps {
  newsletterId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ newsletterId, isOpen, onClose }: ShareModalProps) {
  const [shares, setShares] = useState<ShareToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<AccessRole>("viewer");

  // Fetch active shares
  const fetchShares = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/newsletters/${newsletterId}/shares`);
      if (!res.ok) {
        throw new Error("Failed to load shares");
      }
      const data = await res.json();
      setShares(data.shares || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load shares");
    } finally {
      setLoading(false);
    }
  };

  // Create new share token
  const handleCreateShare = async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch(`/api/newsletters/${newsletterId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create share link");
      }
      const data = await res.json();
      // Refresh shares list
      await fetchShares();
      // Reset role selector to default
      setSelectedRole("viewer");
      // Auto-copy new token
      handleCopyToken(data.token);
    } catch (err: any) {
      setError(err?.message || "Failed to create share link");
    } finally {
      setCreating(false);
    }
  };

  // Revoke share token
  const handleRevokeShare = async (token: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/shares/${token}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to revoke share link");
      }
      // Refresh shares list
      await fetchShares();
    } catch (err: any) {
      setError(err?.message || "Failed to revoke share link");
    }
  };

  // Copy share link to clipboard
  const handleCopyToken = async (token: string) => {
    const shareUrl = `${window.location.origin}/share/${token}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch (err) {
      setError("Failed to copy link");
    }
  };

  // Fetch shares when modal opens
  useEffect(() => {
    if (isOpen) {
      void fetchShares();
    }
  }, [isOpen, newsletterId]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-zinc-300 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Share Newsletter</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            title="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Error message */}
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Access level selector */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Access level
            </label>
            <div className="relative">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as AccessRole)}
                className="w-full appearance-none rounded-lg border border-zinc-300 bg-white px-4 py-2.5 pr-10 text-sm font-medium text-zinc-900 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-blue-400 dark:focus:ring-blue-500/30 cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600"
              >
                <option value="viewer">Viewer (read-only)</option>
                <option value="editor">Editor (can edit)</option>
              </select>
              {/* Custom dropdown arrow */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg
                  className="h-5 w-5 text-zinc-500 transition-transform duration-200 dark:text-zinc-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {/* Selected role indicator with icon */}
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                {selectedRole === "viewer" ? (
                  <svg
                    className="h-4 w-4 text-zinc-500 dark:text-zinc-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4 text-blue-500 dark:text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                )}
              </div>
            </div>
            {selectedRole === "editor" && (
              <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 shadow-sm dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-300">
                <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="leading-relaxed">Editors can modify content but cannot manage access or publish.</span>
              </div>
            )}
            {selectedRole === "viewer" && (
              <div className="mt-2.5 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Viewers can only view the newsletter, no editing allowed.</span>
              </div>
            )}
          </div>

          {/* Create share button */}
          <button
            onClick={handleCreateShare}
            disabled={creating}
            className="mb-4 w-full rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 cursor-pointer"
          >
            {creating ? "Creating..." : "Create Share Link"}
          </button>

          {/* Active shares list */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Active Share Links</h3>
            {loading ? (
              <div className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</div>
            ) : shares.length === 0 ? (
              <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                No active share links. Create one to share this newsletter.
              </div>
            ) : (
              <div className="space-y-2">
                {shares.map((share) => {
                  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/share/${share.token}`;
                  return (
                    <div
                      key={share.token}
                      className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                            {share.role === "viewer" ? "Viewer" : "Editor"}
                          </span>
                          {share.expiresAt && (
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              (Expires {new Date(share.expiresAt).toLocaleDateString()})
                            </span>
                          )}
                        </div>
                        <div className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {shareUrl}
                        </div>
                      </div>
                      <div className="ml-2 flex items-center gap-1">
                        <button
                          onClick={() => handleCopyToken(share.token)}
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded text-zinc-600 transition hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-50"
                          title="Copy link"
                        >
                          {copiedToken === share.token ? (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => handleRevokeShare(share.token)}
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded text-red-600 transition hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                          title="Revoke"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
