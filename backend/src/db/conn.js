// Load environment variables from .env file into process.env
import dotenv from "dotenv";

// Import MongoDB client and Server API version enum
import { MongoClient, ServerApiVersion } from "mongodb";

// Initialize dotenv configuration
dotenv.config();

// Read MongoDB connection URI from environment variables
// Fallback to empty string if not defined
const uri = process.env.MONGO_URI || "";

// Validate that MongoDB URI exists
if (!uri) {
  console.error("MONGO_URI is missing in .env file");
  process.exit(1); // Stop the application if URI is missing
}

// Create a new MongoDB client instance
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1, // Use stable MongoDB Server API v1
    strict: true,                // Enforce strict API usage
    deprecationErrors: true,     // Throw errors for deprecated features
  },
});

try {
  // Establish connection to MongoDB server
  await client.connect();

  // Send a ping command to verify successful connection
  await client.db("admin").command({ ping: 1 });

  // Log success message
  console.log(
    "Pinged your deployment. You successfully connected to MongoDB!"
  );
} catch (err) {
  // Log any connection or runtime errors
  console.error(err);
}

// Get reference to the application database
const db = client.db("finsight");

// Export database instance for use in other files
export default db;
