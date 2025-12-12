import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import {
  updateNewsletterSchema,
  type UpdateNewsletterInput,
} from "@/lib/validators/newsletter";
import Newsletter from "@/models/Newsletter";
import User from "@/models/User";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function GET(_req: NextRequest, { params }: Params) {
  await connectToDatabase();

  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { id } = await params;

  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const newsletter = await Newsletter.findOne({
    _id: id,
    userId: user._id,
  });

  if (!newsletter) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ newsletter });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  await connectToDatabase();

  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { id } = await params;

  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let payload: UpdateNewsletterInput;
  try {
    const json = await req.json();
    payload = updateNewsletterSchema.parse(json);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid payload", details: error },
      { status: 400 }
    );
  }

  const newsletter = await Newsletter.findOneAndUpdate(
    { _id: id, userId: user._id },
    { $set: payload },
    { new: true }
  );

  if (!newsletter) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ newsletter });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  await connectToDatabase();

  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { id } = await params;

  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const deleted = await Newsletter.findOneAndDelete({
    _id: id,
    userId: user._id,
  });

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

