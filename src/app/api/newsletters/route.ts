import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import {
  createNewsletterSchema,
  type CreateNewsletterInput,
} from "@/lib/validators/newsletter";
import Newsletter from "@/models/Newsletter";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  const newsletters = await Newsletter.find({ userId: session.user.id }).sort({
    updatedAt: -1,
  });

  return NextResponse.json({ newsletters });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: CreateNewsletterInput;
  try {
    const json = await req.json();
    payload = createNewsletterSchema.parse(json);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid payload", details: error },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const newsletter = await Newsletter.create({
    title: payload.title,
    structureJSON: payload.structureJSON,
    userId: session.user.id,
  });

  return NextResponse.json({ newsletter }, { status: 201 });
}

