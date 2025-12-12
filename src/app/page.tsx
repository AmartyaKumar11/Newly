import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-16 dark:bg-zinc-950">
      <div className="w-full max-w-5xl rounded-2xl bg-white p-10 shadow-sm ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-800">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Newly
            </p>
            <h1 className="text-4xl font-semibold text-zinc-900 dark:text-zinc-50 md:text-5xl">
              AI-first newsletter studio for modern teams
            </h1>
            <p className="max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
              Drag-and-drop design, Gemini-powered content and Supabase-backed
              assets — all in one place. Start with a prompt or build from
              scratch.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Continue with Google
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-lg border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:border-blue-200 hover:text-blue-700 dark:border-zinc-700 dark:text-zinc-100 dark:hover:border-blue-600 dark:hover:text-blue-400"
              >
                Open dashboard
              </Link>
            </div>
          </div>
          <div className="flex h-full w-full max-w-md flex-col gap-3 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 p-6 text-sm text-zinc-700 ring-1 ring-blue-100 dark:from-blue-950/50 dark:to-purple-950/50 dark:text-zinc-300 dark:ring-blue-900/50 md:w-96">
            <div className="rounded-lg bg-white/80 p-4 shadow-sm ring-1 ring-zinc-100 dark:bg-zinc-800/80 dark:ring-zinc-700">
              <p className="text-xs font-medium uppercase tracking-widest text-blue-600 dark:text-blue-400">
                Phase 1
              </p>
              <ul className="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                <li>• Google sign-in powered by NextAuth</li>
                <li>• MongoDB + Mongoose persistence</li>
                <li>• Gemini + Supabase service stubs</li>
                <li>• Newsletter CRUD API routes</li>
                <li>• Dashboard and editor placeholders</li>
              </ul>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Looking for the editor? Head to the dashboard and open a draft to
              start designing.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
