import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function EditorPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
            Editor (placeholder)
          </p>
          <h1 className="text-2xl font-semibold text-zinc-900">
            Drag & drop canvas coming soon
          </h1>
          <p className="text-sm text-zinc-600">
            Hook this page to Zustand state and the newsletter CRUD APIs to load
            and save designs.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-10 text-sm text-zinc-500">
        Editor canvas will render here. Include toolbars, sidebars, and the
        rendered newsletter layout.
      </div>
    </div>
  );
}

