import { z } from "zod"
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc"
import { db } from "@/server/db"
import { TRPCError } from "@trpc/server"

export const databaseRouter = createTRPCRouter({
  getSchema: publicProcedure.query(async () => {
    try {
      // Query the database schema information
      const tables = await db.query(`
        SELECT 
          table_name 
        FROM 
          information_schema.tables 
        WHERE 
          table_schema = 'public'
      `)

      const schema = []

      for (const table of tables.rows) {
        const tableName = table.table_name

        // Get column information for each table
        const columns = await db.query(
          `
          SELECT 
            c.column_name, 
            c.data_type,
            CASE 
              WHEN pk.constraint_type = 'PRIMARY KEY' THEN true
              ELSE false
            END as is_primary
          FROM 
            information_schema.columns c
          LEFT JOIN (
            SELECT 
              tc.constraint_type, 
              kcu.column_name
            FROM 
              information_schema.table_constraints tc
            JOIN 
              information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
            WHERE 
              tc.table_name = $1
              AND tc.constraint_type = 'PRIMARY KEY'
          ) pk 
          ON c.column_name = pk.column_name
          WHERE 
            c.table_name = $1
          ORDER BY 
            c.ordinal_position
        `,
          [tableName],
        )

        schema.push({
          name: tableName,
          columns: columns.rows.map((col) => ({
            name: col.column_name,
            type: col.data_type,
            isPrimary: col.is_primary,
          })),
        })
      }

      return schema
    } catch (error) {
      console.error("Error fetching schema:", error)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch database schema",
        cause: error,
      })
    }
  }),

  executeQuery: publicProcedure.input(z.object({ query: z.string() })).query(async ({ input }) => {
    try {
      const result = await db.query(input.query)
      return {
        data: result.rows,
        columns: result.fields.map((field) => field.name),
      }
    } catch (error) {
      console.error("Error executing query:", error)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to execute query",
        cause: error,
      })
    }
  }),
})

