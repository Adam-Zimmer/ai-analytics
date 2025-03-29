"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { useState } from "react"

interface QueryResultsProps {
  question: string
  data: any[]
  columns: string[]
  rowCount?: number
  sqlQuery?: string
}

export function QueryResults({ question, data, columns, rowCount, sqlQuery }: QueryResultsProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    if (sqlQuery) {
      navigator.clipboard.writeText(sqlQuery)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No results found</CardTitle>
          <CardDescription>Try asking a different question</CardDescription>
        </CardHeader>
        {sqlQuery && (
          <CardContent>
            <div className="text-xs text-muted-foreground mt-2 mb-4">
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium">Generated SQL:</span>
                <Button variant="ghost" size="sm" className="h-6 px-2" onClick={copyToClipboard}>
                  {copied ? "Copied!" : <Copy className="h-3 w-3" />}
                </Button>
              </div>
              <pre className="bg-slate-50 p-2 rounded-md overflow-x-auto">{sqlQuery}</pre>
            </div>
          </CardContent>
        )}
      </Card>
    )
  }

  // Filter out any special columns that start with underscore for the table header
  const displayColumns = columns.filter((col) => !col.startsWith("_"))

  // Check if results were truncated
  const truncatedMessage = data.find((row) => row._truncated_message)
  const displayData = data.filter((row) => !row._truncated_message)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Results for: {question}</CardTitle>
        <CardDescription>
          {rowCount !== undefined ? `Found ${rowCount} records` : `Found ${displayData.length} records`}
        </CardDescription>
      </CardHeader>

      {sqlQuery && (
        <div className="px-6 pb-2">
          <div className="text-xs text-muted-foreground mt-2 mb-4">
            <div className="flex justify-between items-start mb-1">
              <span className="font-medium">Generated SQL:</span>
              <Button variant="ghost" size="sm" className="h-6 px-2" onClick={copyToClipboard}>
                {copied ? "Copied!" : <Copy className="h-3 w-3" />}
              </Button>
            </div>
            <pre className="bg-slate-50 p-2 rounded-md overflow-x-auto">{sqlQuery}</pre>
          </div>
        </div>
      )}

      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {displayColumns.map((column) => (
                  <TableHead key={column}>{column}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {displayColumns.map((column) => (
                    <TableCell key={`${rowIndex}-${column}`}>
                      {row[column] !== null && row[column] !== undefined ? String(row[column]) : "N/A"}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {truncatedMessage && (
          <div className="mt-4 p-2 bg-yellow-50 text-yellow-800 rounded-md text-sm">
            {truncatedMessage._truncated_message}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

