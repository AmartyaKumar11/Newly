/**
 * Section AI Action Result Telemetry Endpoint
 * 
 * Tracks the final result of section AI actions (applied, cancelled, failed).
 * This completes the telemetry loop for section actions.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { logAIOperation } from "@/lib/aiLogger";
import User from "@/models/User";

interface SectionActionResultRequest {
  actionType: string;
  sectionId?: string;
  result: "applied" | "cancelled" | "failed";
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const body: SectionActionResultRequest = await req.json();
    
    if (!body.actionType || !body.result) {
      return NextResponse.json(
        { error: "actionType and result are required" },
        { status: 400 }
      );
    }

    // Log the action result (non-blocking telemetry)
    logAIOperation({
      userId: user._id.toString(),
      userEmail: user.email,
      operation: `section_ai_action_result`,
      duration: 0,
      success: body.result === "applied",
      error: body.error,
      metadata: {
        actionType: body.actionType,
        sectionId: body.sectionId,
        result: body.result,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to log section action result:", error);
    // Don't fail the request if telemetry fails
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
