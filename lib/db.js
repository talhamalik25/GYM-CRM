import mongoose from "mongoose";

// Reuse the same connection promise during dev hot reload and concurrent requests.
const globalWithMongoose = globalThis;
if (!globalWithMongoose.mongooseCache) {
  globalWithMongoose.mongooseCache = { connection: null, promise: null };
}

export default async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is missing. Add your MongoDB connection string to .env.local.");
  }

  const cache = globalWithMongoose.mongooseCache;
  if (cache.connection) return cache.connection;

  if (!cache.promise) {
    cache.promise = mongoose.connect(uri).then((instance) => instance);
  }

  try {
    cache.connection = await cache.promise;
    return cache.connection;
  } catch (error) {
    // Clear a failed promise so a later request can retry after the DB is available.
    cache.promise = null;
    throw error;
  }
}
