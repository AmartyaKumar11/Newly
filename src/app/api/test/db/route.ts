import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    // Test Mongoose connection
    const mongooseConn = await connectToDatabase();
    const mongooseState = mongooseConn.connection.readyState;
    const mongooseDbName = mongooseConn.connection.db?.databaseName;

    // Test MongoDB native client connection
    const mongoClient = await clientPromise;
    const mongoDbName = mongoClient.db().databaseName;
    const adminDb = mongoClient.db().admin();
    const serverStatus = await adminDb.ping();

    return NextResponse.json(
      {
        success: true,
        mongoose: {
          connected: mongooseState === 1,
          state: mongooseState,
          stateName: getMongooseStateName(mongooseState),
          database: mongooseDbName,
        },
        mongodb: {
          connected: true,
          database: mongoDbName,
          ping: serverStatus,
        },
        message: "MongoDB connection successful!",
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        message: "MongoDB connection failed",
      },
      { status: 500 }
    );
  }
}

function getMongooseStateName(state: number): string {
  const states: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  return states[state] || "unknown";
}

