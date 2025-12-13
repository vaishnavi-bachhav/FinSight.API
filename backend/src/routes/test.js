// routes/category.js
import express from "express";
import db from "../db/conn.js";

const router = express.Router();

// -----------------------------
// GET: all categories
// -----------------------------
router.get("/", async (req, res) => {
  try {
    const collection = await db.collection("categories").find({}).toArray();
    res.status(200).send(collection);
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).send("Error fetching categories");
  }
});


export default router;
