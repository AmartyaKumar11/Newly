import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
            Dashboard
          </p>
          <h1 className="text-3xl font-semibold text-zinc-900">
            Welcome back, {session.user?.name || "creator"}
          </h1>
          <p className="text-sm text-zinc-600">
            Create a new newsletter or continue where you left off.
          </p>
        </div>
        <Link
          href="/editor"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          New newsletter
        </Link>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Drafts</h2>
          <span className="text-xs text-zinc-500">Coming soon</span>
        </div>
        <p className="mt-3 text-sm text-zinc-600">
          API routes are ready for CRUD. Connect the editor to list and edit
          newsletters here.
        </p>
      </div>
    </div>
  );
}

