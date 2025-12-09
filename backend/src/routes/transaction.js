import express from "express";
import db from "../db/conn.js";
import { ObjectId } from "mongodb";

const router = express.Router();

// -----------------------------
// GET: all transactions
// -----------------------------
router.get("/", async (req, res) => {
  try {
    let collection = await db.collection("transactions");
    let results = await collection.find({}).sort({ date: -1 }).toArray();
    res.send(results).status(200);
  } catch (err) {
    console.error("Error fetching transactions:", err);
    res.status(500).send("Error fetching transactions");
  }
});

// -----------------------------
// POST: create a new transaction
// payload example:
// {
//   date: "2023-12-28",
//   type: "income",
//   amount: 1500,
//   note: "Salary"
// }
// -----------------------------
router.post("/", async (req, res) => {
  try {
    let transaction = {
      date: req.body.date,
      type: req.body.type,
      amount: req.body.amount,
      note: req.body.note || "",
    };

    let collection = await db.collection("transactions");
    let result = await collection.insertOne(transaction);

    res.send(result).status(201);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding transaction");
  }
});

// -----------------------------
// PUT /transaction/:id
// Update a transaction
// -----------------------------
router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body;

    const result = await db.collection("transactions").updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json({ message: "Transaction updated successfully" });
  } catch (error) {
    console.error("Update failed", error);
    res.status(500).json({ message: "Server error while updating transaction" });
  }
});

// -----------------------------
// DELETE /transaction/:id
// -----------------------------
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const result = await db
      .collection("transactions")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Delete failed:", error);
    res.status(500).json({ message: "Server error while deleting transaction" });
  }
});

export default router;
