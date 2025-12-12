import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectToDatabase } from "@/lib/db";
import Newsletter from "@/models/Newsletter";
import User from "@/models/User";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  await connectToDatabase();

  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { id, blocks, structureJSON } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "Newsletter ID is required" }, { status: 400 });
  }

  const updated = await Newsletter.findByIdAndUpdate(
    id,
    {
      blocks,
      structureJSON,
      updatedAt: new Date(),
      lastAutosave: new Date()
    },
    { new: true }
  );

  if (!updated) {
    return NextResponse.json({ error: "Newsletter not found" }, { status: 404 });
  }

  // Verify the newsletter belongs to the user
  if (updated.userId.toString() !== user._id.toString()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return NextResponse.json({ updated });
}

