// routes/fx.js
// Handles foreign exchange rate fetching using Frankfurter API

import express from "express";
import axios from "axios";

const router = express.Router();

// --------------------------------------------------
// GET /fx/rate
// Fetch latest exchange rate based on base currency
// Example: /fx/rate?base=USD&symbols=INR,EUR
// --------------------------------------------------
router.get("/rate", async (req, res) => {
  // Read query parameters with default values
  const base = req.query.base || "USD";       // Base currency
  const symbols = req.query.symbols || "INR"; // Target currency/currencies

  try {
    // Call Frankfurter exchange rate API
    const response = await axios.get(
      "https://api.frankfurter.dev/v1/latest",
      {
        params: { base, symbols }, // Forward query params to API
      }
    );

    // Return only required fields to client
    res.json({
      base: response.data.base,
      date: response.data.date,
      rates: response.data.rates,
    });
  } catch (err) {
    // Log API or network errors
    console.error("FX API error:", err.message);

    // Return generic error response
    res.status(500).json({ message: "Failed to fetch FX rate" });
  }
});

// Export router to be mounted in main Express app
export default router;
