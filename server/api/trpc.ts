import { initTRPC } from "@trpc/server"
import superjson from "superjson"
import { ZodError } from "zod"

// Create a new tRPC instance
const t = initTRPC.create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

// Export the tRPC router and procedure helpers
export const createTRPCRouter = t.router
export const publicProcedure = t.procedure

