"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc/client"
import { QueryInput } from "@/components/query-input"
import { QueryResults } from "@/components/query-results"
import { RecentQueries } from "@/components/recent-queries"
import { DatabaseSchema } from "@/components/database-schema"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function Dashboard() {
  const [activeWidget, setActiveWidget] = useState<{
    id: string
    question: string
    data: any
    columns: string[]
    rowCount?: number,
    sqlQuery?: string
  } | null>(null)

  // Get database schema
  const {
    data: schema,
    isLoading: isSchemaLoading,
    error: schemaError,
  } = trpc.database.getSchema.useQuery(undefined, {
    retry: 1,
    retryDelay: 1000,
  })

  // Ask question mutation
  const askQuestion = trpc.ai.askQuestion.useMutation({
    onSuccess: (result) => {
      setActiveWidget({
        id: Date.now().toString(),
        question: result.json.question || "",
        data: result.json.data,
        columns: result.json.columns,
        rowCount: result.json.rowCount,
        sqlQuery: result.json.sqlQuery,
      })

      // Save to recent queries in localStorage
      const recentQueries = JSON.parse(localStorage.getItem("recentQueries") || "[]")
      const question = result.question || ""
      if (question && !recentQueries.includes(question)) {
        recentQueries.unshift(question)
        localStorage.setItem("recentQueries", JSON.stringify(recentQueries.slice(0, 10)))
      }
    },
  })

  const handleAskQuestion = async (question: string) => {
    try {
      console.log("Asking question:", question)
      await askQuestion.mutateAsync({json: { question }})
    } catch (error) {
      console.error("Error asking question:", error)
    }
  }

  // Check for connection errors
  const hasConnectionError = schemaError?.message.includes("Failed to fetch")
  const isDisabled = hasConnectionError || isSchemaLoading

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-9 space-y-6">
        {hasConnectionError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>
              {schemaError?.message || "Failed to connect to the database"}
              <div className="mt-2">
                <strong>Troubleshooting:</strong>
                <ul className="list-disc pl-5 mt-1">
                  <li>Check if your database is running and accessible</li>
                  <li>Verify your DATABASE_URL environment variable is correct</li>
                  <li>Make sure your database user has the necessary permissions</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {askQuestion.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{askQuestion.error.message}</AlertDescription>
          </Alert>
        )}

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <h2 className="text-2xl font-bold tracking-tight">Database Analytics</h2>
            <p className="text-muted-foreground">Ask questions about your database in natural language</p>
          </div>
          <div className="p-6 pt-0">
            <QueryInput onSubmit={handleAskQuestion} isLoading={askQuestion.isLoading} disabled={isDisabled} />
          </div>
        </div>

        {activeWidget && (
          <QueryResults
            question={activeWidget.question}
            data={activeWidget.data}
            columns={activeWidget.columns}
            rowCount={activeWidget.rowCount}
            sqlQuery={activeWidget.sqlQuery}
          />
        )}
      </div>

      <div className="lg:col-span-3 space-y-6">
        <RecentQueries onSelect={handleAskQuestion} disabled={isDisabled} />
        {schema && <DatabaseSchema schema={schema} />}
      </div>
    </div>
  )
}

