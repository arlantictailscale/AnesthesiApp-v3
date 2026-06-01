import { NextResponse } from "next/server"
import { DEFAULT_AI_MODEL } from "@/lib/ai-models"

export const runtime = "nodejs"
export const maxDuration = 60

const SYSTEM_PROMPT_TEMPLATE = (scenario: string, instructions: string, rubricJson: string, equipment: string) => `
You are the Clinical Examiner (Penguji) for an Objective Structured Clinical Examination (OSCE) in anesthesiology for AnesthesiApp.
Your task is to conduct a strict clinical exam roleplay in Bahasa Indonesia.

Station Details:
- Scenario: ${scenario}
- Instructions for Participant:
${instructions}
- Available Equipment: ${equipment}
- Examiner Rubrics:
${rubricJson}

Your Roleplay Guidelines:
1. Act strictly as the clinical examiner (Penguji). If the participant says they speak to or interact with the patient, you should also respond as the patient when appropriate.
2. Start the conversation by greeting the participant, setting the scene briefly, and instructing them to begin.
3. Guide the participant through the tasks step-by-step. Let them answer. If their response is vague, ask clinical follow-up questions to test their knowledge (e.g. "Obat apa yang akan Anda berikan?", "Berapa dosisnya?", "Bagaimana cara menentukan landmark tersebut?").
4. DO NOT give away the answers, correct values, or let them know if their answer matches the rubric perfectly. Maintain a formal, neutral, academic clinical examination tone.
5. Keep your responses relatively concise (1-3 paragraphs) to match an actual verbal exchange in an OSCE station.
6. Speak in formal Bahasa Indonesia mixed with standard medical terminology.
`.trim()

export async function POST(req: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "OPENROUTER_API_KEY is not configured" }, { status: 500 })
  }

  let body: {
    messages?: { role: "user" | "assistant" | "system"; content: string }[]
    scenario: string
    instructions: string
    rubric: any[]
    equipment: string[]
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { messages, scenario, instructions, rubric, equipment } = body

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Messages history is required" }, { status: 400 })
  }

  const rubricStr = JSON.stringify(rubric, null, 2)
  const equipmentStr = equipment.join(", ")

  const systemPrompt = SYSTEM_PROMPT_TEMPLATE(scenario, instructions, rubricStr, equipmentStr)

  const origin = req.headers.get("origin") ?? "https://anesthesiapp.local"

  let res: Response
  try {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": origin,
        "X-Title": "AnesthesiApp OSCE Examiner",
      },
      body: JSON.stringify({
        model: DEFAULT_AI_MODEL,
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    })
  } catch (err) {
    console.error("[OSCE Chat] OpenRouter fetch failed:", err)
    return NextResponse.json({ error: "Failed to reach OpenRouter" }, { status: 502 })
  }

  if (!res.ok) {
    const errText = await res.text()
    console.error("[OSCE Chat] OpenRouter error:", res.status, errText)
    return NextResponse.json(
      { error: `OpenRouter ${res.status}: ${errText.slice(0, 300)}` },
      { status: 502 },
    )
  }

  const payload = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const reply = payload.choices?.[0]?.message?.content ?? ""

  return NextResponse.json({ reply })
}
