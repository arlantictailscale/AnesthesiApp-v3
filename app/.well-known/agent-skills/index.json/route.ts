import { NextResponse } from "next/server"
import { getRequestOrigin } from "@/lib/origin"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const origin = getRequestOrigin(request)

  const index = {
    $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
    "skills": [
      {
        "name": "case-auto-population",
        "type": "skill-md",
        "description": "Automatically extracts structured clinical data and anesthesiology parameters from unstructured text.",
        "url": `${origin}/skills/case-auto-population.md`,
        "digest": "sha256:21a1d9b3f39017916a2cefb4d2074d46b43d1209051b3689df24fa1130b3357a"
      }
    ]
  }

  return NextResponse.json(index, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600"
    }
  })
}
