/**
 * clear-db.ts
 * Run this script to drop all collections and start fresh.
 *
 * Usage:
 *   npx tsx src/scripts/clear-db.ts
 */
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const MONGO_URI =
  process.env.MONGODB_URI || "mongodb+srv://debu:Debu%40123@cluster1.obllfdj.mongodb.net/smart-eval";

async function clearDatabase() {
  console.log(`Connecting to: ${MONGO_URI}`);
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected");

  const db = mongoose.connection.db;

  // ✅ FIX: safety check for TypeScript
  if (!db) {
    throw new Error("❌ Database not initialized");
  }

  const collections = await db.listCollections().toArray();

  if (collections.length === 0) {
    console.log("Database is already empty.");
  } else {
    for (const col of collections) {
      await db.dropCollection(col.name);
      console.log(`🗑️ Dropped collection: ${col.name}`);
    }
    console.log("✅ All collections cleared.");
  }

  await mongoose.disconnect();
  console.log("Disconnected. Database is clean and ready.");
}

clearDatabase().catch((err) => {
  console.error("❌ Failed to clear database:", err);
  process.exit(1);
});
