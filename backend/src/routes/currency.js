import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/rate", async (req, res) => {
  const base = req.query.base || "USD";
  const symbols = req.query.symbols || "INR";

  try {
    const response = await axios.get("https://api.frankfurter.dev/v1/latest", {
      params: { base, symbols },
    });

    res.json({
      base: response.data.base,
      date: response.data.date,
      rates: response.data.rates,
    });
  } catch (err) {
    console.error("FX API error:", err.message);
    res.status(500).json({ message: "Failed to fetch FX rate" });
  }
});

export default router;
