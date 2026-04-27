import cors from "cors";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import path from "path";
import authRoutes from "./src/routes/auth.routes";
import assignmentsRoutes from "./src/routes/assignments.routes";
import evaluationsRoutes from "./src/routes/evaluations.routes";
import reportsRoutes from "./src/routes/reports.routes";
import studentsRoutes from "./src/routes/students.routes";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5000);

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "src", "public")));

// ── API Routes ──────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/students", studentsRoutes);
app.use("/api/assignments", assignmentsRoutes);
app.use("/api/evaluations", evaluationsRoutes);
app.use("/api/reports", reportsRoutes);

app.get("/api/health", (_req, res) => res.json({ status: "ok", db: mongoose.connection.readyState === 1 ? "connected" : "disconnected" }));

// ── Global error handler ────────────────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: err.message || "Internal server error" });
});

// ── MongoDB connection ──────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/smart-eval";

async function startServer() {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    const db = mongoose.connection;
    console.log(`✅ MongoDB connected: ${db.host}:${db.port}/${db.name}`);

    db.on("error", (err) => console.error("❌ MongoDB error:", err));
    db.on("disconnected", () => console.warn("⚠️  MongoDB disconnected"));

    app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    console.error("Make sure MongoDB is running: mongod --dbpath /data/db");
    process.exit(1);
  }
}

// ── Handle unhandled rejections ─────────────────────────────────────────────
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

startServer();
