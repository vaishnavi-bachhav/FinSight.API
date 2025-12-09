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

// PUT /category/:id
router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updatedData = req.body;

    const result = await db.collection("categories").updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ message: "Category updated successfully" });
  } catch (error) {
    console.error("Update failed", error);
    res.status(500).json({ message: "Server error while updating category" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const result = await db
      .collection("categories")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Delete failed:", error);
    res.status(500).json({ message: "Server error while deleting category" });
  }
});

export default router;