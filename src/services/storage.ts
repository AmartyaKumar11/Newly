import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseClient: SupabaseClient | null = null;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials are not fully configured");
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

