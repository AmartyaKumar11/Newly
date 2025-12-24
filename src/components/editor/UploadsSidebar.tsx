"use client";

import { useRef, useState } from "react";
import { useAssets } from "@/hooks/useAssets";

export function UploadsSidebar() {
  const { assets, loading, uploading, error, uploadFiles, refresh } = useAssets();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    void uploadFiles(files);
    // Reset input so selecting the same file again still triggers change
    event.target.value = "";
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    const files = Array.from(event.dataTransfer.files).filter((file) =>
      ["image/jpeg", "image/png", "image/webp", "image/svg+xml"].includes(file.type)
    );
    if (files.length > 0) {
      void uploadFiles(files);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  };

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Upload controls */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={openFilePicker}
          className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Upload files"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          className="hidden"
          onChange={handleFileSelect}
        />

        <div
          className={`flex flex-col items-center justify-center rounded-lg border border-dashed px-3 py-6 text-center text-xs transition ${
            isDragOver
              ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950/30 dark:text-blue-300"
              : "border-zinc-300 bg-zinc-50 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <p className="font-medium">Drag and drop images here</p>
          <p className="mt-1 text-[11px]">
            JPG, PNG, WEBP or SVG. Max 5MB per file.
          </p>
        </div>
      </div>

      {/* Status / errors */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 dark:border-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Assets grid */}
      <div className="flex-1 overflow-y-auto">
        {loading && assets.length === 0 ? (
          <div className="space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
            <div className="h-24 w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-24 w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          </div>
        ) : assets.length === 0 ? (
          <div className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
            <p className="font-medium">No uploads yet</p>
            <p>Upload images to reuse them across newsletters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <div className="relative block w-full pb-[75%]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.url}
                    alt="Asset"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer refresh (optional safety) */}
      <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
        <span>{assets.length} assets</span>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded px-2 py-1 text-[11px] hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}

