// routes/transaction.js
// Handles CRUD operations for user transactions
// Includes aggregation for monthly grouping, totals, and category joins

import express from "express";
import db from "../db/conn.js";                // MongoDB connection instance
import { ObjectId } from "mongodb";            // For converting string IDs to ObjectId
import { getAuth } from "@clerk/express";      // Clerk authentication helper

const router = express.Router();

// --------------------------------------------------
// GET /transactions
// Fetch all transactions for the authenticated user
// - Joins category data
// - Groups transactions by month
// - Calculates income, expense, and net totals
// --------------------------------------------------
router.get("/", async (req, res) => {
  try {
    // Extract authentication details from Clerk
    const { userId, isAuthenticated } = getAuth(req);

    // Block unauthenticated access
    if (!isAuthenticated || !userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const collection = db.collection("transactions");

    // MongoDB aggregation pipeline
    const results = await collection
      .aggregate([
        // 1️⃣ Only fetch transactions belonging to this user
        { $match: { userId } },

        // 2️⃣ Join category details from categories collection
        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "category",
          },
        },

        // 3️⃣ Keep transaction even if category is missing/deleted
        {
          $unwind: {
            path: "$category",
            preserveNullAndEmptyArrays: true,
          },
        },

        // 4️⃣ Provide a fallback category if none exists
        {
          $addFields: {
            category: {
              $ifNull: [
                "$category",
                {
                  _id: null,
                  name: "Uncategorized",
                  type: "$type",
                  icon: null,
                },
              ],
            },
          },
        },

        // 5️⃣ Ensure date field is a Date object
        { $addFields: { date: { $toDate: "$date" } } },

        // 6️⃣ Sort transactions newest first
        { $sort: { date: -1, _id: -1 } },

        // 7️⃣ Group transactions by year and month
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              month: { $month: "$date" },
            },
            transactions: { $push: "$$ROOT" },

            // Calculate total income for the month
            totalIncome: {
              $sum: {
                $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
              },
            },

            // Calculate total expense for the month
            totalExpense: {
              $sum: {
                $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0],
              },
            },
          },
        },

        // 8️⃣ Convert year/month into a real Date for formatting & sorting
        {
          $addFields: {
            monthDate: {
              $dateFromParts: {
                year: "$_id.year",
                month: "$_id.month",
                day: 1,
              },
            },
          },
        },

        // 9️⃣ Shape the final response structure
        {
          $project: {
            _id: 0,
            month: {
              $dateToString: {
                date: "$monthDate",
                format: "%b %Y",
              },
            },
            transactions: 1,
            totalIncome: 1,
            totalExpense: 1,
            net: {
              $subtract: ["$totalIncome", "$totalExpense"],
            },
            monthDate: 1,
          },
        },

        // 🔟 Sort months newest → oldest
        { $sort: { monthDate: -1 } },

        // 1️⃣1️⃣ Remove helper field from response
        { $project: { monthDate: 0 } },
      ])
      .toArray();

    res.status(200).send(results);
  } catch (err) {
    console.error("Error fetching transactions:", err);
    res.status(500).send("Error fetching transactions");
  }
});

// --------------------------------------------------
// POST /transactions
// Create a new transaction for the authenticated user
// --------------------------------------------------
router.post("/", async (req, res) => {
  try {
    const { userId, isAuthenticated } = getAuth(req);

    // Authentication check
    if (!isAuthenticated || !userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { date, type, amount, note, categoryId } = req.body;

    // Validate required fields
    if (!date || !type || !amount || !categoryId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Transaction document
    const transaction = {
      userId,                       // 🔐 Associate with Clerk user
      date: new Date(date),
      type,                         // "income" | "expense"
      amount: Number(amount),
      note: note || "",
      categoryId: new ObjectId(categoryId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const collection = db.collection("transactions");
    const result = await collection.insertOne(transaction);

    // 201 Created
    res.status(201).send(result);
  } catch (err) {
    console.error("Error adding transaction:", err);
    res.status(500).send("Error adding transaction");
  }
});

// --------------------------------------------------
// PUT /transactions/:id
// Update transaction only if it belongs to the user
// --------------------------------------------------
router.put("/:id", async (req, res) => {
  try {
    const { userId, isAuthenticated } = getAuth(req);

    // Authentication check
    if (!isAuthenticated || !userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const id = req.params.id;
    const { date, type, amount, note, categoryId } = req.body;

    // Build update object dynamically
    const updates = {
      ...(date && { date: new Date(date) }),
      ...(type && { type }),
      ...(amount !== undefined && { amount: Number(amount) }),
      ...(note !== undefined && { note }),
      ...(categoryId && { categoryId: new ObjectId(categoryId) }),
      updatedAt: new Date(),
    };

    // Update only if user owns the transaction
    const result = await db.collection("transactions").updateOne(
      {
        _id: new ObjectId(id),
        userId,
      },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json({ message: "Transaction updated successfully" });
  } catch (error) {
    console.error("Update failed", error);
    res
      .status(500)
      .json({ message: "Server error while updating transaction" });
  }
});

// --------------------------------------------------
// DELETE /transactions/:id
// Delete transaction only if it belongs to the user
// --------------------------------------------------
router.delete("/:id", async (req, res) => {
  try {
    const { userId, isAuthenticated } = getAuth(req);

    // Authentication check
    if (!isAuthenticated || !userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const id = req.params.id;

    // Delete only user-owned transaction
    const result = await db
      .collection("transactions")
      .deleteOne({ _id: new ObjectId(id), userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Delete failed:", error);
    res
      .status(500)
      .json({ message: "Server error while deleting transaction" });
  }
});

// Export router
export default router;