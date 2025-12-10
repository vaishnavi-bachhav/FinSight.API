import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { clerkMiddleware, requireAuth } from "@clerk/express";
import categories from "./routes/category.js";
import transactions from "./routes/transaction.js";
import currency from "./routes/currency.js";

dotenv.config();

if (!process.env.CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
  console.error("❌ Clerk Keys Missing in Backend Env File");
  process.exit(1);
}
console.log("Clerk Publishable Key:", process.env.CLERK_PUBLISHABLE_KEY);
console.log("Clerk Secret Key:", process.env.CLERK_SECRET_KEY);


const app = express();
const PORT = process.env.PORT || 3000;

// CORS must allow credentials + exact origin
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

// Clerk middleware must come before protected routes
app.use(clerkMiddleware());

// Protected API routes
app.use("/category", requireAuth(), categories);
app.use("/transaction", requireAuth(), transactions);

// Unprotected (external API passthrough)
app.use("/currency", currency);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
