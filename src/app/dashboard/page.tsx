import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Newsletter from "@/models/Newsletter";
import User from "@/models/User";
import { CreateNewsletterButton } from "./CreateNewsletterButton";

interface NewsletterData {
  _id: { toString(): string };
  title?: string;
  status?: string;
  updatedAt?: Date | string;
  createdAt?: Date | string;
}

async function getNewsletters(email: string): Promise<NewsletterData[]> {
  await connectToDatabase();
  const user = await User.findOne({ email });
  if (!user) return [];

  const newsletters = await Newsletter.find({ userId: user._id })
    .sort({ updatedAt: -1 })
    .lean();

  return newsletters as NewsletterData[];
}

function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const newsletters = await getNewsletters(session.user.email);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 bg-white px-6 py-10 dark:bg-zinc-950">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Dashboard
          </p>
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            Welcome back, {session.user?.name || "creator"}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Create a new newsletter or continue where you left off.
          </p>
        </div>
        <CreateNewsletterButton />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Your Newsletters
          </h2>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {newsletters.length} {newsletters.length === 1 ? "newsletter" : "newsletters"}
          </span>
        </div>

        {newsletters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              No newsletters yet
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Get started by creating your first newsletter
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {newsletters.map((newsletter) => (
              <Link
                key={newsletter._id.toString()}
                href={`/editor/${newsletter._id}`}
                className="group rounded-lg border border-zinc-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-600"
              >
                <h3 className="font-semibold text-zinc-900 group-hover:text-blue-600 dark:text-zinc-50 dark:group-hover:text-blue-400">
                  {newsletter.title || "Untitled Newsletter"}
                </h3>
                <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="capitalize">{newsletter.status || "draft"}</span>
                  <span>•</span>
                  <span>{formatDate(newsletter.updatedAt || newsletter.createdAt)}</span>
                </div>
                {newsletter.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {newsletter.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

