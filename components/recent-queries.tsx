"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface RecentQueriesProps {
  onSelect: (question: string) => void
  disabled?: boolean
}

export function RecentQueries({ onSelect, disabled = false }: RecentQueriesProps) {
  const [recentQueries, setRecentQueries] = useState<string[]>([])

  useEffect(() => {
    const savedQueries = localStorage.getItem("recentQueries")
    if (savedQueries) {
      setRecentQueries(JSON.parse(savedQueries))
    } else {
      // Default examples if no history exists
      const defaultQueries = [
        "How many bets did my user make?",
        "What's the average bet amount?",
        "Show me top 10 users by bet count",
      ]
      localStorage.setItem("recentQueries", JSON.stringify(defaultQueries))
      setRecentQueries(defaultQueries)
    }
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Queries</CardTitle>
        <CardDescription>Click to run a previous query</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {recentQueries.length > 0 ? (
            recentQueries.map((query, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start text-left"
                onClick={() => onSelect(query)}
                disabled={disabled}
              >
                {query}
              </Button>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No recent queries</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

