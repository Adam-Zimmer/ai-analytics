import { z } from "zod"
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc"
import { db } from "@/server/db"
import OpenAI from "openai"
import { TRPCError } from "@trpc/server"

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const aiRouter = createTRPCRouter({
  askQuestion: publicProcedure
    .input(z.any())
    .mutation(async ({ input }) => {
      // Log the exact input received
      console.log("AI Router received input:", JSON.stringify(input))

      if(!input?.question) throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Question cannot be empty",
      });
      try {
        // Get the database schema to provide context to the AI
        const schemaResult = await db
          .query(`
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
          .catch((err) => {
            console.error("Database schema query error:", err)
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to fetch database schema",
              cause: err,
            })
          })

        // If no schema is found, return a simple response
        if (schemaResult.rows.length === 0) {
          return {
            question: input.question,
            data: [{ message: "No database schema found or database is empty" }],
            columns: ["message"],
            sqlQuery: "-- No schema available",
          }
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

        // Generate SQL query using OpenAI
        const completion = await openai.chat.completions
          .create({
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
                content: input.question,
              },
            ],
          })
          .catch((err) => {
            console.error("OpenAI API error:", err)
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to generate SQL query",
              cause: err,
            })
          })

        let sqlQuery = completion.choices[0]?.message?.content || ""

        // Extract SQL from code blocks if present
        if (sqlQuery.includes("```")) {
          const match = sqlQuery.match(/```(?:sql)?([\s\S]*?)```/)
          if (match && match[1]) {
            sqlQuery = match[1].trim()
          }
        }

        console.log("Generated SQL query:", sqlQuery)

        // Execute the generated SQL query
        const result = await db.query(sqlQuery).catch((err) => {
          console.error("SQL execution error:", err)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `SQL execution failed: ${err.message}`,
            cause: err,
          })
        })

        // Limit the number of rows returned to prevent payload size issues
        const MAX_ROWS = 1000
        const limitedRows = result.rows.slice(0, MAX_ROWS)

        // Add a message if rows were truncated
        const rowsTruncated = result.rows.length > MAX_ROWS

        return {
          question: input.question,
          data: rowsTruncated
            ? [
                ...limitedRows,
                { _truncated_message: `Results truncated. Showing ${MAX_ROWS} of ${result.rows.length} rows.` },
              ]
            : limitedRows,
          columns: [...result.fields.map((field) => field.name), ...(rowsTruncated ? ["_truncated_message"] : [])],
          sqlQuery,
          rowCount: result.rows.length,
        }
      } catch (error) {
        // If it's already a TRPCError, rethrow it
        if (error instanceof TRPCError) {
          throw error
        }

        console.error("Error processing AI question:", error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to process your question: ${error.message}`,
          cause: error,
        })
      }
    }),
})

