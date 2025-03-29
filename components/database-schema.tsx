"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"

interface SchemaTable {
  name: string
  columns: {
    name: string
    type: string
    isPrimary: boolean
  }[]
}

interface DatabaseSchemaProps {
  schema: SchemaTable[]
}

export function DatabaseSchema({ schema }: DatabaseSchemaProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Schema</CardTitle>
        <CardDescription>Tables and columns in your database</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {schema.json.map((table) => (
            <AccordionItem key={table.name} value={table.name}>
              <AccordionTrigger>{table.name}</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1">
                  {table.columns.map((column) => (
                    <div key={column.name} className="flex items-center justify-between">
                      <span className="text-sm">
                        {column.name}
                        {column.isPrimary && (
                          <Badge variant="outline" className="ml-2">
                            PK
                          </Badge>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">{column.type}</span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  )
}

