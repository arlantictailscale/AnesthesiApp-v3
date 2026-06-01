import { NextResponse } from "next/server"
import { DEFAULT_AI_MODEL } from "@/lib/ai-models"

export const runtime = "nodejs"
export const maxDuration = 60

const SYSTEM_PROMPT_TEMPLATE = (rubricJson: string) => `
You are the Clinical Evaluator for an anesthesiology OSCE (Objective Structured Clinical Examination) station.
Your job is to read a chat transcript between a Candidate (User) and the Examiner (Assistant) and score the Candidate's performance against the official rubric.

Rubrics to score against:
${rubricJson}

Instructions:
1. For each aspect in the rubric, assign a score of 0, 1, 2, or 3 based strictly on the candidate's answers and actions in the chat transcript.
   - 0: None of the key items were mentioned or performed.
   - 1 or 2: Partial/incomplete answers, missing major items, or wrong clinical sequence.
   - 3: Correct, complete, and clinically appropriate performance of the aspect's items.
2. Provide a specific feedback summary for each aspect in Bahasa Indonesia, explaining what was performed correctly and what was missed.
3. Provide an overall qualitative feedback summary (under the "feedback" key) outlining key strengths and suggestions for improvement in Bahasa Indonesia.
4. Output ONLY a valid JSON object. No markdown code blocks, no trailing comments, no introductory prose.

JSON Schema Response:
{
  "scores": {
    "Aspect Name 1": number (0-3),
    "Aspect Name 2": number (0-3)
  },
  "feedback": "Overall clinical feedback...",
  "breakdown": [
    {
      "aspect": "Aspect Name 1",
      "score": number (0-3),
      "max_score": 3,
      "feedback": "Detailed justification of this score..."
    }
  ]
}
`.trim()

function extractJson(text: string): any {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  const body = fenced ? fenced[1] : trimmed
  const firstBrace = body.indexOf("{")
  const lastBrace = body.lastIndexOf("}")
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("Model did not return a valid JSON object")
  }
  return JSON.parse(body.slice(firstBrace, lastBrace + 1))
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "OPENROUTER_API_KEY is not configured" }, { status: 500 })
  }

  let body: {
    chatHistory: { role: "user" | "assistant" | "system"; content: string }[]
    rubric: any[]
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { chatHistory, rubric } = body

  if (!chatHistory || !Array.isArray(chatHistory) || chatHistory.length === 0) {
    return NextResponse.json({ error: "Chat history transcript is required" }, { status: 400 })
  }

  const rubricStr = JSON.stringify(rubric, null, 2)
  const systemPrompt = SYSTEM_PROMPT_TEMPLATE(rubricStr)

  const userPrompt = `
Berikut adalah transkrip percakapan OSCE. Silakan evaluasi dan berikan nilai sesuai rubrik penilaian dalam format JSON.

Transkrip Ujian:
${chatHistory.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n")}
  `.trim()

  const origin = req.headers.get("origin") ?? "https://anesthesiapp.local"

  let res: Response
  try {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": origin,
        "X-Title": "AnesthesiApp OSCE Scorer",
      },
      body: JSON.stringify({
        model: DEFAULT_AI_MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    })
  } catch (err) {
    console.error("[OSCE Scorer] OpenRouter fetch failed:", err)
    return NextResponse.json({ error: "Failed to reach OpenRouter" }, { status: 502 })
  }

  if (!res.ok) {
    const errText = await res.text()
    console.error("[OSCE Scorer] OpenRouter error:", res.status, errText)
    return NextResponse.json(
      { error: `OpenRouter ${res.status}: ${errText.slice(0, 300)}` },
      { status: 502 },
    )
  }

  const payload = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const content = payload.choices?.[0]?.message?.content ?? ""
  if (!content) {
    return NextResponse.json({ error: "Empty response from scoring model" }, { status: 502 })
  }

  let parsedScore: any
  try {
    parsedScore = extractJson(content)
  } catch (err) {
    console.error("[OSCE Scorer] Failed to parse model score JSON:", content)
    return NextResponse.json({ error: "Failed to evaluate scores JSON" }, { status: 502 })
  }

  return NextResponse.json({ evaluation: parsedScore })
}
