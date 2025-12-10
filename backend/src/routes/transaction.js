// routes/transaction.js
import express from "express";
import db from "../db/conn.js";
import { ObjectId } from "mongodb";
import { getAuth } from "@clerk/express";

const router = express.Router();

// -----------------------------
// GET: all transactions (for current user)
// Sorted, joined with category,
// grouped by month WITH totals
// -----------------------------
router.get("/", async (req, res) => {
  try {
    const { userId, isAuthenticated } = getAuth(req);

    if (!isAuthenticated || !userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const collection = await db.collection("transactions");

    const results = await collection
      .aggregate([
        // 🔐 Only this user's transactions
        {
          $match: {
            userId, // userId stored as string from Clerk
          },
        },

        // Join category
        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: "$category" },

        // Ensure date is Date type for sorting/grouping
        {
          $addFields: {
            date: { $toDate: "$date" },
          },
        },

        // Sort latest first (within each month this order will be preserved)
        {
          $sort: {
            date: -1,
            _id: -1,
          },
        },

        // Group by year + month
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              month: { $month: "$date" },
            },
            transactions: { $push: "$$ROOT" },
            totalIncome: {
              $sum: {
                $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
              },
            },
            totalExpense: {
              $sum: {
                $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0],
              },
            },
          },
        },

        // Project a nice month label + net
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
        {
          $project: {
            _id: 0,
            month: {
              $dateToString: {
                date: "$monthDate",
                format: "%b %Y", // e.g. "Dec 2023"
              },
            },
            transactions: 1,
            totalIncome: 1,
            totalExpense: 1,
            net: { $subtract: ["$totalIncome", "$totalExpense"] },
            monthDate: 1,
          },
        },

        // Sort months (latest first)
        {
          $sort: {
            monthDate: -1,
          },
        },
        {
          $project: {
            monthDate: 0,
          },
        },
      ])
      .toArray();

    res.status(200).send(results);
  } catch (err) {
    console.error("Error fetching transactions:", err);
    res.status(500).send("Error fetching transactions");
  }
});

// -----------------------------
// POST: create a new transaction
// -----------------------------
router.post("/", async (req, res) => {
  try {
    const { userId, isAuthenticated } = getAuth(req);

    if (!isAuthenticated || !userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { date, type, amount, note, categoryId } = req.body;

    if (!date || !type || !amount || !categoryId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const transaction = {
      userId, // 🔐 tag with Clerk userId
      date: new Date(date),
      type, // "income" | "expense"
      amount: Number(amount),
      note: note || "",
      categoryId: new ObjectId(categoryId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const collection = await db.collection("transactions");
    const result = await collection.insertOne(transaction);

    res.status(201).send(result);
  } catch (err) {
    console.error("Error adding transaction:", err);
    res.status(500).send("Error adding transaction");
  }
});

// -----------------------------
// PUT /transactions/:id
// Only update if transaction belongs to this user
// -----------------------------
router.put("/:id", async (req, res) => {
  try {
    const { userId, isAuthenticated } = getAuth(req);

    if (!isAuthenticated || !userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const id = req.params.id;
    const { date, type, amount, note, categoryId } = req.body;

    const updates = {
      ...(date && { date: new Date(date) }),
      ...(type && { type }),
      ...(amount !== undefined && { amount: Number(amount) }),
      ...(note !== undefined && { note }),
      ...(categoryId && { categoryId: new ObjectId(categoryId) }),
      updatedAt: new Date(),
    };

    const result = await db.collection("transactions").updateOne(
      {
        _id: new ObjectId(id),
        userId, // 🔐 ensure user owns this transaction
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

// -----------------------------
// DELETE /transactions/:id
// Only delete if transaction belongs to this user
// -----------------------------
router.delete("/:id", async (req, res) => {
  try {
    const { userId, isAuthenticated } = getAuth(req);

    if (!isAuthenticated || !userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const id = req.params.id;

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

export default router;
