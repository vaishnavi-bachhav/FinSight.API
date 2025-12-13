import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { clerkMiddleware, requireAuth } from "@clerk/express";
import categories from "./routes/category.js";
import transactions from "./routes/transaction.js";
import currency from "./routes/currency.js";
import test from "./routes/test.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// -----------------------------
// Health Check (NO AUTH)
// -----------------------------
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "finsight-api",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173/",
    credentials: true,
  })
);

app.use(express.json());



// Clerk middleware
app.use(clerkMiddleware());

// Protected routes
app.use("/category", requireAuth(), categories);
app.use("/transaction", requireAuth(), transactions);

// External APIs (no auth)
app.use("/currency", currency);
app.use("/test", test);

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});

app.get("/status", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "everything went ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});
