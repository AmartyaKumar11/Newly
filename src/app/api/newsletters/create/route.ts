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

  const { title } = await req.json();

  const newsletter = await Newsletter.create({
    userId: user._id,
    title: title || "Untitled Newsletter"
  });

  return NextResponse.json(newsletter);
}

