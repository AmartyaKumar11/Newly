import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Asset from "@/models/Asset";
import { getSupabaseClient } from "@/services/storage";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

export const runtime = "nodejs";

// POST /api/assets/upload
// Expects multipart/form-data with one or more `file` fields.
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.startsWith("multipart/form-data")) {
    return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
  }

  const formData = await request.formData();
  const files = formData.getAll("file").filter((f): f is File => f instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
  }

  const supabase = getSupabaseClient();
  await connectToDatabase();

  const uploaded: Array<{
    id: string;
    url: string;
    width: number | null;
    height: number | null;
    mimeType: string;
    createdAt: Date;
  }> = [];

  for (const file of files) {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File too large. Max size is 5MB.` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const extension =
      file.type === "image/jpeg"
        ? "jpg"
        : file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
        ? "webp"
        : "svg";

    const fileName = `${session.user.id}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${extension}`;

    const { data, error } = await supabase.storage
      .from("uploads")
      .upload(fileName, buffer, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });

    if (error || !data?.path) {
      console.error("[Supabase upload error]", error ?? new Error("Missing upload path"), {
        path: fileName,
      });
      
      // Provide helpful error message for missing bucket
      if (error?.statusCode === "404" || error?.message?.includes("Bucket not found")) {
        return NextResponse.json(
          { 
            error: "Storage bucket 'uploads' not found. Please create it in your Supabase dashboard under Storage.",
            details: "Go to Supabase Dashboard > Storage > Create a new bucket named 'uploads' (public access recommended)"
          },
          { status: 500 }
        );
      }
      
      // Provide helpful error message for RLS policy violation
      if (error?.statusCode === "403" || error?.message?.includes("row-level security policy")) {
        return NextResponse.json(
          { 
            error: "Upload blocked by Row-Level Security (RLS) policy. Please create a storage policy in Supabase.",
            details: "Go to Supabase Dashboard > Storage > Policies > Select 'uploads' bucket > Click 'New policy' > Create a policy allowing INSERT for authenticated users"
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    const { data: publicUrlData, error: urlError } = supabase.storage
      .from("uploads")
      .getPublicUrl(data.path);

    if (urlError || !publicUrlData?.publicUrl) {
      console.error("[Supabase getPublicUrl error]", urlError ?? new Error("Missing publicUrl"), {
        path: data.path,
      });
      return NextResponse.json(
        { error: "Failed to generate public URL for uploaded file" },
        { status: 500 }
      );
    }

    const assetDoc = await Asset.create({
      userId: session.user.id,
      type: "image",
      url: publicUrlData.publicUrl,
      width: null,
      height: null,
    });

    uploaded.push({
      id: assetDoc._id.toString(),
      url: assetDoc.url,
      width: assetDoc.width,
      height: assetDoc.height,
      mimeType: file.type,
      createdAt: assetDoc.createdAt,
    });
  }

  return NextResponse.json(
    {
      assets: uploaded,
    },
    { status: 201 }
  );
}

