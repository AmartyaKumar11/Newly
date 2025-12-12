import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ Error: MONGODB_URI environment variable is not set");
  console.error("Please add MONGODB_URI to your .env.local file");
  process.exit(1);
}

async function testConnection() {
  // TypeScript guard: MONGODB_URI is guaranteed to be defined after the check above
  const uri = MONGODB_URI!;
  
  try {
    console.log("Testing MongoDB connection...");
    console.log("URI:", uri.replace(/:[^:@]+@/, ":****@"));
    
    await mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB || "newly",
    });

    const state = mongoose.connection.readyState;
    const dbName = mongoose.connection.db?.databaseName;
    
    console.log("\n✅ Connection successful!");
    console.log("Database:", dbName);
    console.log("State:", state === 1 ? "connected" : "unknown");
    
    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("\nCollections:", collections.map(c => c.name));
    
    await mongoose.disconnect();
    console.log("\n✅ Test completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Connection failed!");
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

testConnection();

