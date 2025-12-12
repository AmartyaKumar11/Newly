"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Newsletter {
  _id: string;
  title: string;
  description?: string;
  status?: string;
  blocks?: unknown[];
  structureJSON?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [newsletter, setNewsletter] = useState<Newsletter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNewsletter() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/newsletters/${id}`);

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to load newsletter");
        }

        const data = await response.json();
        setNewsletter(data.newsletter);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchNewsletter();
    }
  }, [id, router]);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 bg-white px-6 py-8 dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Editor
            </p>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Loading...
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Fetching newsletter data...
            </p>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-10 dark:border-zinc-700 dark:bg-zinc-900/60">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-400"></div>
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              Loading newsletter...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 bg-white px-6 py-8 dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-red-600 dark:text-red-400">
              Error
            </p>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Failed to load newsletter
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {error}
            </p>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-10 dark:border-red-900 dark:bg-red-950/20">
          <div className="text-center">
            <p className="text-sm font-medium text-red-900 dark:text-red-400">
              {error}
            </p>
            <Link
              href="/dashboard"
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!newsletter) {
    return (
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 bg-white px-6 py-8 dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
              Editor
            </p>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Newsletter not found
            </h1>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-10 dark:border-zinc-700 dark:bg-zinc-900/60">
          <div className="text-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              The newsletter you're looking for doesn't exist or you don't have access to it.
            </p>
            <Link
              href="/dashboard"
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 bg-white px-6 py-8 dark:bg-zinc-950">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Editor
          </p>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {newsletter.title || "Untitled Newsletter"}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Newsletter ID: {newsletter._id}
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:border-blue-200 hover:text-blue-700 dark:border-zinc-700 dark:text-zinc-100 dark:hover:border-blue-600 dark:hover:text-blue-400"
        >
          Back to Dashboard
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Newsletter Details
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-xs font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Status
              </dt>
              <dd className="mt-1 text-sm font-medium capitalize text-zinc-900 dark:text-zinc-50">
                {newsletter.status || "draft"}
              </dd>
            </div>
            {newsletter.description && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  Description
                </dt>
                <dd className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {newsletter.description}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Created
              </dt>
              <dd className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {newsletter.createdAt
                  ? new Date(newsletter.createdAt).toLocaleString()
                  : "N/A"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Last Updated
              </dt>
              <dd className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {newsletter.updatedAt
                  ? new Date(newsletter.updatedAt).toLocaleString()
                  : "N/A"}
              </dd>
            </div>
            {newsletter.blocks && newsletter.blocks.length > 0 && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  Blocks
                </dt>
                <dd className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {newsletter.blocks.length} block{newsletter.blocks.length !== 1 ? "s" : ""}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Structure Data
          </h2>
          <div className="overflow-auto rounded-lg bg-zinc-50 p-4 dark:bg-zinc-950">
            <pre className="text-xs text-zinc-700 dark:text-zinc-300">
              {JSON.stringify(
                {
                  blocks: newsletter.blocks || [],
                  structureJSON: newsletter.structureJSON || {},
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-zinc-300 bg-white/60 p-10 text-center dark:border-zinc-700 dark:bg-zinc-900/60">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Editor canvas will render here
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Drag & drop functionality coming soon
        </p>
      </div>
    </div>
  );
}
