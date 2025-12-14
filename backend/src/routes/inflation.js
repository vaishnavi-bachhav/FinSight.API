// src/routes/inflation.js
// Fetches inflation (CPI) data from the World Bank API
// Includes simple in-memory caching to reduce API calls

import express from "express";

const router = express.Router();

/**
 * World Bank indicator used:
 * FP.CPI.TOTL.ZG
 * Inflation, consumer prices (annual %)
 *
 * Example endpoint:
 * https://api.worldbank.org/v2/country/USA/indicator/FP.CPI.TOTL.ZG?format=json
 */

// Base URL for World Bank API
const WB_BASE = "https://api.worldbank.org/v2";

// --------------------------------------------------
// Simple in-memory cache (sufficient for class projects)
// cacheKey -> { data, expiresAt }
// --------------------------------------------------
const cache = new Map();

// Cache time-to-live: 12 hours
const CACHE_TTL_MS = 1000 * 60 * 60 * 12;

/**
 * Fetch inflation data for a given country
 * @param {string} countryCode - ISO country code (e.g., USA, IND)
 * @returns {Object} inflation data (latest + time series)
 */
async function fetchInflation(countryCode) {
  // Construct World Bank API URL
  const url = `${WB_BASE}/country/${countryCode}/indicator/FP.CPI.TOTL.ZG?format=json&per_page=60`;

  // Call World Bank API
  const res = await fetch(url);

  // Handle non-200 responses
  if (!res.ok) {
    throw new Error(`WorldBank API error: ${res.status}`);
  }

  // Parse JSON response
  // Response format: [ metadata, data[] ]
  const json = await res.json();
  const rows = json?.[1] || [];

  // Filter valid numeric values and normalize response
  const cleaned = rows
    .filter((r) => typeof r?.value === "number" && r?.date)
    .map((r) => ({
      year: Number(r.date),
      value: r.value,
    }))
    .sort((a, b) => a.year - b.year); // sort ascending by year

  // Latest available inflation record
  const latest = cleaned[cleaned.length - 1] || null;

  return {
    country: countryCode,
    latest,          // { year, value }
    series: cleaned, // full time series (useful for charts)
  };
}

// --------------------------------------------------
// GET /inflation
// Example: /inflation?country=IND
// --------------------------------------------------
router.get("/", async (req, res) => {
  try {
    // Default to USA if country is not provided
    const country = (req.query.country || "USA").toUpperCase();

    // Create cache key per country
    const cacheKey = `inflation:${country}`;
    const cached = cache.get(cacheKey);

    // Serve cached data if not expired
    if (cached && cached.expiresAt > Date.now()) {
      return res.json({ ...cached.data, cached: true });
    }

    // Fetch fresh inflation data
    const data = await fetchInflation(country);

    // Store result in cache
    cache.set(cacheKey, {
      data,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    // Send response (indicate non-cached result)
    res.json({ ...data, cached: false });
  } catch (err) {
    console.error("Inflation fetch error:", err);

    // Generic error response to client
    res.status(500).json({ message: "Failed to fetch inflation data" });
  }
});

// Export router to be mounted in main Express app
export default router;