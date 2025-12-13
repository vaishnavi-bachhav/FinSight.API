// src/routes/inflation.js
import express from "express";

const router = express.Router();

/**
 * World Bank indicator:
 * FP.CPI.TOTL.ZG = Inflation, consumer prices (annual %)
 *
 * Example:
 * https://api.worldbank.org/v2/country/USA/indicator/FP.CPI.TOTL.ZG?format=json
 */

const WB_BASE = "https://api.worldbank.org/v2";

// simple in-memory cache (good enough for class project)
const cache = new Map();
// cache key -> { data, expiresAt }
const CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

async function fetchInflation(countryCode) {
  const url = `${WB_BASE}/country/${countryCode}/indicator/FP.CPI.TOTL.ZG?format=json&per_page=60`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`WorldBank API error: ${res.status}`);

  const json = await res.json();
  // json = [metadata, data[]]
  const rows = json?.[1] || [];

  // keep only entries with a number value
  const cleaned = rows
    .filter((r) => typeof r?.value === "number" && r?.date)
    .map((r) => ({
      year: Number(r.date),
      value: r.value,
    }))
    .sort((a, b) => a.year - b.year);

  const latest = cleaned[cleaned.length - 1] || null;

  return {
    country: countryCode,
    latest,          // { year, value }
    series: cleaned, // array for charting
  };
}

router.get("/", async (req, res) => {
  try {
    const country = (req.query.country || "USA").toUpperCase();

    const cacheKey = `inflation:${country}`;
    const cached = cache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return res.json({ ...cached.data, cached: true });
    }

    const data = await fetchInflation(country);

    cache.set(cacheKey, {
      data,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    res.json({ ...data, cached: false });
  } catch (err) {
    console.error("Inflation fetch error:", err);
    res.status(500).json({ message: "Failed to fetch inflation data" });
  }
});

export default router;
