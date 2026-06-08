"use client"

import { useEffect } from "react"

export function WebMcpProvider() {
  useEffect(() => {
    // Check if the experimental WebMCP modelContext object is available
    const nav = navigator as any
    const modelContext = nav.modelContext

    if (modelContext) {
      try {
        const tool = {
          name: "populate_anesthesia_case",
          description: "Auto-populate anesthesia case details from free-text notes.",
          inputSchema: {
            type: "object",
            properties: {
              description: {
                type: "string",
                description: "Handover notes or case description"
              }
            },
            required: ["description"]
          },
          execute: async ({ description }: { description: string }) => {
            const res = await fetch("/api/ai/populate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ description })
            })
            return await res.json()
          }
        }

        // Support provideContext() as well as registerTool()
        if (typeof modelContext.provideContext === "function") {
          modelContext.provideContext({
            tools: [tool]
          })
          console.log("[WebMCP] Registered tools via provideContext");
        } else if (typeof modelContext.registerTool === "function") {
          modelContext.registerTool(tool)
          console.log("[WebMCP] Registered tool via registerTool");
        }
      } catch (err) {
        console.error("[WebMCP] WebMCP tools registration failed:", err)
      }
    }
  }, [])

  return null
}
