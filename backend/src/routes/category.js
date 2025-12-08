import express from "express";
import db from "../db/conn.js";
import { ObjectId } from "mongodb";

const router = express.Router();

router.get("/", async (req, res) => {
  let collection = await db.collection("categories");
  let results = await collection.find({}).toArray();
  res.send(results).status(200);
});

// This section will help you create a new record.
router.post("/", async (req, res) => {
  try {
    let category = {
      name: req.body.name,
      icon: req.body.icon,
      type: req.body.type,
      transactions: [],
    };
    let collection = await db.collection("categories");
    let result = await collection.insertOne(category);
    res.send(result).status(204);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding record");
  }
});

export default router;