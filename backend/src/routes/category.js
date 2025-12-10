// routes/category.js
import express from "express";
import db from "../db/conn.js";
import { ObjectId } from "mongodb";
import { getAuth } from "@clerk/express";

const router = express.Router();

// -----------------------------
// GET: all categories for current user
// -----------------------------
router.get("/", async (req, res) => {
  try {
    const { userId, isAuthenticated } = getAuth(req);

    if (!isAuthenticated || !userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const collection = await db.collection("categories");
    const results = await collection.find({ userId }).toArray();

    // You had res.send(...).status(200) which actually sets status *after* sending.
    // Use status().send() instead:
    res.status(200).send(results);
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).send("Error fetching categories");
  }
});

// -----------------------------
// POST: create a new category
// -----------------------------
router.post("/", async (req, res) => {
  try {
    const { userId, isAuthenticated } = getAuth(req);

    if (!isAuthenticated || !userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { name, icon, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: "Name and type are required" });
    }

    const category = {
      userId,       // 🔐 tag category with Clerk userId
      name,
      icon,
      type,         // "income" | "expense"
      transactions: [], // you had this field, kept for compatibility
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const collection = await db.collection("categories");
    const result = await collection.insertOne(category);

    // 201 Created is more correct than 204 here since we return payload
    res.status(201).send(result);
  } catch (err) {
    console.error("Error adding category:", err);
    res.status(500).send("Error adding record");
  }
});

// -----------------------------
// PUT /category/:id
// Only update if category belongs to this user
// -----------------------------
router.put("/:id", async (req, res) => {
  try {
    const { userId, isAuthenticated } = getAuth(req);

    if (!isAuthenticated || !userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const id = req.params.id;
    const updatedData = {
      ...req.body,
      updatedAt: new Date(),
    };

    const result = await db.collection("categories").updateOne(
      {
        _id: new ObjectId(id),
        userId, // 🔐 ensure user can only update their own category
      },
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

// -----------------------------
// DELETE /category/:id
// Only delete if category belongs to this user
// -----------------------------
router.delete("/:id", async (req, res) => {
  try {
    const { userId, isAuthenticated } = getAuth(req);

    if (!isAuthenticated || !userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const id = req.params.id;

    const result = await db
      .collection("categories")
      .deleteOne({ _id: new ObjectId(id), userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Delete failed:", error);
    res
      .status(500)
      .json({ message: "Server error while deleting category" });
  }
});

export default router;
