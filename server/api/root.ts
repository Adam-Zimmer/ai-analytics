import { createTRPCRouter } from "@/server/api/trpc"
import { databaseRouter } from "@/server/api/routers/database"
import { aiRouter } from "@/server/api/routers/ai"

export const appRouter = createTRPCRouter({
  database: databaseRouter,
  ai: aiRouter,
})

export type AppRouter = typeof appRouter

