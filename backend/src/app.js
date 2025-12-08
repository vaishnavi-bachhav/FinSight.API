import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import categories from "./routes/category.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
app.use("/category", categories);

// start the Express server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
