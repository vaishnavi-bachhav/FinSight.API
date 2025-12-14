// src/index.js (or server.js)
// Entry point for the FinSight backend API

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { clerkMiddleware, requireAuth } from "@clerk/express";

// Route modules
import categories from "./routes/category.js";
import transactions from "./routes/transaction.js";
import currency from "./routes/currency.js";
import inflation from "./routes/inflation.js";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Define server port
const PORT = process.env.PORT || 8080;

// --------------------------------------------------
// Root route (public)
// --------------------------------------------------
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to FinSight API 🚀",
    version: "1.0.0",
  });
});

// --------------------------------------------------
// Health check endpoint (NO AUTH)
// Used for uptime monitoring and deployments
// --------------------------------------------------
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "finsight-api",
    uptime: process.uptime(),               // Server uptime in seconds
    timestamp: new Date().toISOString(),    // Current server time
  });
});

// --------------------------------------------------
// CORS configuration
// Allows frontend app to communicate with backend
// --------------------------------------------------
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173/",
    credentials: true, // Allow cookies / auth headers
  })
);

// --------------------------------------------------
// Middleware
// --------------------------------------------------

// Parse incoming JSON payloads
app.use(express.json());

// Initialize Clerk authentication middleware
app.use(clerkMiddleware());

// --------------------------------------------------
// Routes
// --------------------------------------------------

// Protected routes (authentication required)
app.use("/category", requireAuth(), categories);
app.use("/transaction", requireAuth(), transactions);

// Public routes (external APIs, no authentication)
app.use("/currency", currency);
app.use("/inflation", inflation);

// --------------------------------------------------
// Start HTTP server
// --------------------------------------------------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});