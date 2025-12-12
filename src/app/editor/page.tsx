import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function EditorPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 bg-white px-6 py-8 dark:bg-zinc-950">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Editor (placeholder)
          </p>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Drag & drop canvas coming soon
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Hook this page to Zustand state and the newsletter CRUD APIs to load
            and save designs.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-10 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-400">
        Editor canvas will render here. Include toolbars, sidebars, and the
        rendered newsletter layout.
      </div>
    </div>
  );
}

