import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { appRouter } from "@/server/api/root"

export const maxDuration = 60 // Extend the function timeout to 60 seconds

const handler = async (req: Request) => {
  // Log the request details for debugging
  console.log("TRPC Request:", {
    method: req.method,
    url: req.url,
  })

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => ({}),
    onError: ({ error, path }) => {
      console.error(`Error in tRPC path ${path}:`, error)
    },
    responseMeta: () => {
      return {
        headers: {
          // Increase response size limit
          "Transfer-Encoding": "chunked",
        },
      }
    },
  })
}

export { handler as GET, handler as POST }

