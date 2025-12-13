"use client";

import { useParams } from "next/navigation";
import { EditorLayout } from "@/components/editor/EditorLayout";

// Force dynamic rendering - this route should not be statically generated
export const dynamic = "force-dynamic";

export default function EditorPage() {
  const params = useParams();
  const id = params.id as string;

  if (!id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950">
        <div className="text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Invalid newsletter ID
          </p>
        </div>
      </div>
    );
  }

  return <EditorLayout newsletterId={id} />;
}
