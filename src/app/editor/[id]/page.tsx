import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Newsletter from "@/models/Newsletter";
import User from "@/models/User";
import mongoose from "mongoose";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

async function getNewsletter(id: string, userEmail: string) {
  await connectToDatabase();
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  const user = await User.findOne({ email: userEmail });
  if (!user) return null;

  const newsletter = await Newsletter.findOne({
    _id: id,
    userId: user._id,
  }).lean();

  return newsletter;
}

export default async function EditorPage({ params }: Params) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const { id } = await params;
  const newsletter = await getNewsletter(id, session.user.email);

  if (!newsletter) {
    redirect("/dashboard");
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
            Drag & drop canvas coming soon. Newsletter ID: {id}
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

