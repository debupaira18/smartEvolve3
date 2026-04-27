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

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/smart-eval";

async function clearDatabase() {
  console.log(`Connecting to: ${MONGO_URI}`);
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected");

  const collections = await mongoose.connection.db.listCollections().toArray();
  if (collections.length === 0) {
    console.log("Database is already empty.");
  } else {
    for (const col of collections) {
      await mongoose.connection.db.dropCollection(col.name);
      console.log(`🗑️  Dropped collection: ${col.name}`);
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
