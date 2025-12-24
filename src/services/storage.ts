import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseClient: SupabaseClient | null = null;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("[Supabase] Environment variables are not fully configured");
} else {
  // Debug-only: helps verify that env vars are wired correctly in dev.
  // We intentionally log only a short prefix of the key to avoid leaking secrets.
  console.log("[Supabase] Configuration loaded", {
    url: supabaseUrl,
    keyPrefix: supabaseKey.slice(0, 8) + "...",
  });
}

export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are missing");
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }

  return supabaseClient;
}

export async function uploadImage(buffer: Buffer, path: string, bucket = "uploads") {
  const client = getSupabaseClient();
  const { data, error } = await client.storage
    .from(bucket)
    .upload(path, buffer, { upsert: true, contentType: "image/png" });

  if (error) {
    throw error;
  }

  return data.path;
}

