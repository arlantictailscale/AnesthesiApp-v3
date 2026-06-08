import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const origin = url.origin

  const card = {
    serverInfo: {
      name: "AnesthesiApp AI Assistant",
      version: "1.0.0"
    },
    endpoint: `${origin}/api/mcp`,
    capabilities: {
      tools: [
        {
          name: "populate_case",
          description: "Auto-populate anesthesia case documentation from unstructured free-text clinical notes in Indonesian.",
          inputSchema: {
            type: "object",
            properties: {
              description: {
                type: "string",
                description: "Handover notes or case description in Indonesian."
              }
            },
            required: ["description"]
          }
        }
      ]
    }
  }

  return NextResponse.json(card, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600"
    }
  })
}
