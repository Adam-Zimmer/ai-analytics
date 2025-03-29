import { Pool } from "pg"

// Function to determine if SSL should be used based on the connection string
function shouldUseSSL(connectionString: string): boolean {
  // Local connections typically don't need SSL
  if (connectionString.includes("localhost") || connectionString.includes("127.0.0.1")) {
    return false
  }

  // Cloud providers typically require SSL
  return true
}

// Get the connection string from environment variables
const connectionString = process.env.DATABASE_URL || ""

// Create database connection with conditional SSL
export const db = new Pool({
  connectionString,
  ssl: shouldUseSSL(connectionString)
    ? {
        rejectUnauthorized: true,
      }
    : false,
  // Set a statement timeout to prevent long-running queries
  statement_timeout: 10000, // 10 seconds
})

// Test the connection on startup
db.query("SELECT NOW()")
  .then(() => console.log("Database connection established"))
  .catch((err) => console.error("Database connection failed:", err))

