import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Missing MONGODB_URI environment variable");
}

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const client = new MongoClient(uri);

const clientPromise =
  global._mongoClientPromise || client.connect().then((connected) => {
    global._mongoClientPromise = Promise.resolve(connected);
    return connected;
  });

export default clientPromise;

