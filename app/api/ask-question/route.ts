import { NextResponse } from "next/server"
import { db } from "@/server/db"
import OpenAI from "openai"

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { question } = body

    console.log("Received question:", question)

    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Question is required and must be a string" }, { status: 400 })
    }

    // Get the database schema to provide context to the AI
    const schemaResult = await db.query(`
      SELECT 
        table_name,
        column_name,
        data_type
      FROM 
        information_schema.columns
      WHERE 
        table_schema = 'public'
      ORDER BY 
        table_name, 
        ordinal_position
    `)

    // If no schema is found, return a simple response
    if (schemaResult.rows.length === 0) {
      return NextResponse.json({
        data: [{ message: "No database schema found or database is empty" }],
        columns: ["message"],
        sqlQuery: "-- No schema available",
      })
    }

    // Format the schema information for the AI
    const schemaInfo = schemaResult.rows.reduce((acc, row) => {
      if (!acc[row.table_name]) {
        acc[row.table_name] = []
      }
      acc[row.table_name].push({
        column: row.column_name,
        type: row.data_type,
      })
      return acc
    }, {})

    const schemaText = Object.entries(schemaInfo)
      .map(([table, columns]) => {
        return `Table: ${table}\nColumns: ${(columns as any[]).map((c) => `${c.column} (${c.type})`).join(", ")}`
      })
      .join("\n\n")

    // Generate SQL query using OpenAI directly
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a SQL expert. Your task is to convert natural language questions into PostgreSQL queries.
          Use only the tables and columns provided in the schema. Return ONLY the SQL query without any explanation.
          Make sure the query is secure and doesn't allow SQL injection.
          The database schema is as follows:
          
          ${schemaText}`,
        },
        {
          role: "user",
          content: question,
        },
      ],
    })

    const sqlQuery = completion.choices[0]?.message?.content || ""
    console.log("Generated SQL query:", sqlQuery)

    // Execute the generated SQL query
    const result = await db.query(sqlQuery)

    return NextResponse.json({
      data: result.rows,
      columns: result.fields.map((field) => field.name),
      sqlQuery,
    })
  } catch (error) {
    console.error("Error processing question:", error)
    return NextResponse.json({ error: `Failed to process your question: ${error.message}` }, { status: 500 })
  }
}

