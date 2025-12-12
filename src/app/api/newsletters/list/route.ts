import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectToDatabase } from "@/lib/db";
import Newsletter from "@/models/Newsletter";
import User from "@/models/User";
import { authOptions } from "@/lib/auth";

export async function GET() {
  await connectToDatabase();

  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const newsletters = await Newsletter.find({ userId: user._id })
    .sort({ updatedAt: -1 });

  return NextResponse.json({ newsletters });
}

