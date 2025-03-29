import dotenv from "dotenv"
import { Pool } from "pg"

// Load environment variables
dotenv.config()

async function testConnection() {
  console.log("Testing database connection...")

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error("DATABASE_URL environment variable is not set")
    process.exit(1)
  }

  console.log(`Connecting to: ${connectionString.replace(/:[^:]*@/, ":****@")}`)

  const pool = new Pool({
    connectionString,
    ssl:
      connectionString.includes("localhost") || connectionString.includes("127.0.0.1")
        ? false
        : { rejectUnauthorized: true },
  })

  try {
    const result = await pool.query("SELECT NOW()")
    console.log("Connection successful!")
    console.log("Current database time:", result.rows[0].now)

    // Test schema access
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `)

    console.log("\nDatabase tables:")
    if (tables.rows.length === 0) {
      console.log("No tables found in the public schema")
    } else {
      tables.rows.forEach((row, i) => {
        console.log(`${i + 1}. ${row.table_name}`)
      })
    }
  } catch (error) {
    console.error("Connection failed:", error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

testConnection()

