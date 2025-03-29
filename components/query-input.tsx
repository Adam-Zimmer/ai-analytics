"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"

interface QueryInputProps {
  onSubmit: (question: string) => void
  isLoading: boolean
  disabled?: boolean
}

export function QueryInput({ onSubmit, isLoading, disabled = false }: QueryInputProps) {
  const [question, setQuestion] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (question.trim()) {
      onSubmit(question.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
      <Input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder={
          disabled
            ? "Connect to the database to ask questions"
            : "Ask a question about your data (e.g., 'How many bets did my user make?')"
        }
        className="flex-1"
        disabled={isLoading || disabled}
      />
      <Button type="submit" size="icon" disabled={isLoading || disabled || !question.trim()}>
        <Send className="h-4 w-4" />
      </Button>
    </form>
  )
}

