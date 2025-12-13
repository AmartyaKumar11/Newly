import { NextResponse } from "next/server";

export async function GET() {
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;

  return NextResponse.json({
    hasNextAuthUrl: !!nextAuthUrl,
    nextAuthUrl: nextAuthUrl || "NOT SET",
    hasNextAuthSecret: !!nextAuthSecret,
    // Don't expose the actual secret, just confirm it exists
    nextAuthSecretSet: !!nextAuthSecret,
    message: nextAuthUrl
      ? "NEXTAUTH_URL is configured"
      : "NEXTAUTH_URL is missing - set it in .env.local",
  });
}
