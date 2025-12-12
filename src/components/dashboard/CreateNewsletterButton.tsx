"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateNewsletterButton() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreate() {
    setIsCreating(true);
    try {
      const response = await fetch("/api/newsletters/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: "Untitled Newsletter" }),
      });

      if (!response.ok) {
        throw new Error("Failed to create newsletter");
      }

      const newsletter = await response.json();
      router.push(`/editor/${newsletter._id}`);
    } catch (error) {
      console.error("Error creating newsletter:", error);
      alert("Failed to create newsletter. Please try again.");
      setIsCreating(false);
    }
  }

  return (
    <button
      onClick={handleCreate}
      disabled={isCreating}
      className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600"
    >
      {isCreating ? "Creating..." : "Create Newsletter"}
    </button>
  );
}

