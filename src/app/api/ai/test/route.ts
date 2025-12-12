import { NextResponse } from "next/server";
import { generateText } from "@/services/gemini";

export async function GET() {
  try {
    const text = await generateText(
      "Say hello from Newly in one concise sentence."
    );
    return NextResponse.json({ text });
  } catch (error) {
    return NextResponse.json(
      { error: "Gemini request failed", details: `${error}` },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    const text = await generateText(prompt || "Draft a newsletter greeting.");
    return NextResponse.json({ text });
  } catch (error) {
    return NextResponse.json(
      { error: "Gemini request failed", details: `${error}` },
      { status: 500 }
    );
  }
}

