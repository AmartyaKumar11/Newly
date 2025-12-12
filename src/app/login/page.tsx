"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center bg-white px-6 py-12 dark:bg-zinc-950">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
          Newly
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          Sign in to your workspace
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Continue with Google to access the dashboard and editor.
        </p>

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Continue with Google
        </button>

        <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
          By continuing you agree to the workspace terms. Need an invite?{" "}
          <Link href="/signup" className="font-semibold text-blue-700 dark:text-blue-400">
            Request access
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

