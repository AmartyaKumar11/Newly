import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Asset from "@/models/Asset";

// GET /api/assets
// Returns the authenticated user's assets (image only), newest first.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const assets = await Asset.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  const response = assets.map((asset) => ({
    id: asset._id.toString(),
    type: asset.type,
    url: asset.url,
    width: asset.width,
    height: asset.height,
    createdAt: asset.createdAt,
  }));

  return NextResponse.json({ assets: response }, { status: 200 });
}

