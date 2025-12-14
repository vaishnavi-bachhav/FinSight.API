// routes/category.js
// Handles CRUD operations for user-specific categories

import express from "express";
import db from "../db/conn.js";              // MongoDB connection instance
import { ObjectId } from "mongodb";          // Used to convert string IDs to MongoDB ObjectId
import { getAuth } from "@clerk/express";    // Clerk authentication helper

const router = express.Router();

// --------------------------------------------------
// GET /category
// Fetch all categories belonging to the authenticated user
// --------------------------------------------------
router.get("/", async (req, res) => {
  try {
    // Extract authentication details from Clerk
    const { userId, isAuthenticated } = getAuth(req);

    // Block request if user is not authenticated
    if (!isAuthenticated || !userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Get categories collection
    const collection = db.collection("categories");

    // Fetch only categories created by this user
    const results = await collection.find({ userId }).toArray();

    // Send categories with success status
    res.status(200).send(results);
  } catch (err) {
    // Log error for debugging
    console.error("Error fetching categories:", err);

    // Return generic server error
    res.status(500).send("Error fetching categories");
  }
});

// --------------------------------------------------
// POST /category
// Create a new category for the authenticated user
// --------------------------------------------------
router.post("/", async (req, res) => {
  try {
    const { userId, isAuthenticated } = getAuth(req);

    // Ensure user is authenticated
    if (!isAuthenticated || !userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Extract category data from request body
    const { name, icon, type } = req.body;

    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({ message: "Name and type are required" });
    }

    // Category document structure
    const category = {
      userId,             // 🔐 Associate category with Clerk user
      name,
      icon,
      type,               // "income" | "expense"
      transactions: [],   // Kept for backward compatibility
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert category into database
    const collection = db.collection("categories");
    const result = await collection.insertOne(category);

    // 201 Created – resource successfully created
    res.status(201).send(result);
  } catch (err) {
    console.error("Error adding category:", err);
    res.status(500).send("Error adding record");
  }
});

// --------------------------------------------------
// PUT /category/:id
// Update a category only if it belongs to the user
// --------------------------------------------------
router.put("/:id", async (req, res) => {
  try {
    const { userId, isAuthenticated } = getAuth(req);

    // Block unauthenticated users
    if (!isAuthenticated || !userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Extract category ID from URL params
    const id = req.params.id;

    // Merge request body and update timestamp
    const updatedData = {
      ...req.body,
      updatedAt: new Date(),
    };

    // Update category only if user owns it
    const result = await db.collection("categories").updateOne(
      {
        _id: new ObjectId(id),
        userId, // 🔐 Prevent users from modifying others' categories
      },
      { $set: updatedData }
    );

    // No matching document found
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ message: "Category updated successfully" });
  } catch (error) {
    console.error("Update failed", error);
    res.status(500).json({ message: "Server error while updating category" });
  }
});

// --------------------------------------------------
// DELETE /category/:id
// Delete a category only if it belongs to the user
// --------------------------------------------------
router.delete("/:id", async (req, res) => {
  try {
    const { userId, isAuthenticated } = getAuth(req);

    // Authentication check
    if (!isAuthenticated || !userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Extract category ID
    const id = req.params.id;

    // Delete category only if user owns it
    const result = await db
      .collection("categories")
      .deleteOne({ _id: new ObjectId(id), userId });

    // No document deleted → not found or not owned by user
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

// Export router for use in main app
export default router;