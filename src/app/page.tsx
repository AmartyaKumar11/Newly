import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-5xl rounded-2xl bg-white p-10 shadow-sm ring-1 ring-zinc-100">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
              Newly
            </p>
            <h1 className="text-4xl font-semibold text-zinc-900 md:text-5xl">
              AI-first newsletter studio for modern teams
            </h1>
            <p className="max-w-2xl text-lg text-zinc-600">
              Drag-and-drop design, Gemini-powered content and Supabase-backed
              assets — all in one place. Start with a prompt or build from
              scratch.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Continue with Google
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-lg border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:border-blue-200 hover:text-blue-700"
              >
                Open dashboard
              </Link>
            </div>
          </div>
          <div className="flex h-full w-full max-w-md flex-col gap-3 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 p-6 text-sm text-zinc-700 ring-1 ring-blue-100 md:w-96">
            <div className="rounded-lg bg-white/80 p-4 shadow-sm ring-1 ring-zinc-100">
              <p className="text-xs font-medium uppercase tracking-widest text-blue-600">
                Phase 1
              </p>
              <ul className="mt-2 space-y-2 text-sm text-zinc-700">
                <li>• Google sign-in powered by NextAuth</li>
                <li>• MongoDB + Mongoose persistence</li>
                <li>• Gemini + Supabase service stubs</li>
                <li>• Newsletter CRUD API routes</li>
                <li>• Dashboard and editor placeholders</li>
              </ul>
            </div>
            <p className="text-xs text-zinc-500">
              Looking for the editor? Head to the dashboard and open a draft to
              start designing.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
