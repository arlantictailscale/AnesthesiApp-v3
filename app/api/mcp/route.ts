import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function GET() {
  return NextResponse.json({
    result: {
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
  }, {
    headers: {
      "Access-Control-Allow-Origin": "*",
    }
  })
}

export async function POST(req: Request) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { method } = body

  if (method === "tools/list") {
    return NextResponse.json({
      result: {
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
    }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
      }
    })
  }

  if (method === "tools/call") {
    const { params } = body
    if (!params || params.name !== "populate_case") {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 })
    }

    const { arguments: args } = params
    const description = args?.description || ""
    if (!description) {
      return NextResponse.json({ error: "Description argument is required" }, { status: 400 })
    }

    const origin = req.headers.get("origin") ?? "https://anesthesiapp.local"
    const supabase = await createClient()

    const authHeader = req.headers.get("authorization") || ""
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1]
      await supabase.auth.setSession({ access_token: token, refresh_token: "" })
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: caseRow, error: insertError } = await supabase
      .from("anesthesia_cases")
      .insert({
        user_id: user.id,
        status: "processing",
        patient_name: "AI Populating...",
      })
      .select("id")
      .single()

    if (insertError || !caseRow) {
      return NextResponse.json({ error: insertError?.message || "Failed to create draft case" }, { status: 500 })
    }

    try {
      fetch(`${origin}/api/ai/populate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader
        },
        body: JSON.stringify({ description })
      }).catch(console.error)
    } catch (err) {
      console.error("Local trigger failed:", err)
    }

    return NextResponse.json({
      result: {
        content: [
          {
            type: "text",
            text: `Success: Case auto-population started in the background. Case ID: ${caseRow.id}`
          }
        ]
      }
    }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
      }
    })
  }

  return NextResponse.json({ error: "Method not supported" }, { status: 400 }, {
    headers: {
      "Access-Control-Allow-Origin": "*",
    }
  })
}
