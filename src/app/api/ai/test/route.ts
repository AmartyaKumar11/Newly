import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";

// DEPRECATED: Use /api/ai/gateway instead
// This route is kept for backward compatibility but should not be used for new features
// All AI operations must go through the gateway for rate limiting and safety

export async function GET() {
  return NextResponse.json(
    { 
      error: "This endpoint is deprecated. Use /api/ai/gateway instead.",
      message: "All AI operations must go through the gateway for rate limiting and safety."
    },
    { status: 410 } // Gone
  );
}

export async function POST(request: Request) {
  // Redirect to gateway with authentication check
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.json(
    { 
      error: "This endpoint is deprecated. Use /api/ai/gateway instead.",
      message: "All AI operations must go through the gateway for rate limiting and safety."
    },
    { status: 410 } // Gone
  );
}

