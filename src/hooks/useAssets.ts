"use client";

import { useCallback, useEffect, useState } from "react";

export interface Asset {
  id: string;
  type: "image";
  url: string;
  width: number | null;
  height: number | null;
  createdAt: string | Date;
  mimeType?: string;
}

interface UseAssetsState {
  assets: Asset[];
  loading: boolean;
  uploading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  uploadFiles: (files: File[] | FileList | null) => Promise<void>;
}

// Client-side asset hook, fully decoupled from editor state
export function useAssets(): UseAssetsState {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/assets", { method: "GET" });
      if (!res.ok) {
        throw new Error("Failed to load assets");
      }
      const data = await res.json();
      const list = (data.assets || []) as Asset[];
      setAssets(list);
    } catch (err: any) {
      console.error("Failed to fetch assets", err);
      setError(err?.message || "Failed to load assets");
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadFiles = useCallback(
    async (files: File[] | FileList | null) => {
      if (!files || ("length" in files && files.length === 0)) return;

      const fileArray = Array.from(files as FileList | File[]);
      const formData = new FormData();
      fileArray.forEach((file) => formData.append("file", file));

      setUploading(true);
      setError(null);
      try {
        const res = await fetch("/api/assets/upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Upload failed");
        }
        const data = await res.json();
        const uploaded = (data.assets || []) as Asset[];
        // Prepend newly uploaded assets to the list
        setAssets((prev) => [...uploaded, ...prev]);
      } catch (err: any) {
        console.error("Failed to upload assets", err);
        setError(err?.message || "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    []
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    assets,
    loading,
    uploading,
    error,
    refresh,
    uploadFiles,
  };
}

