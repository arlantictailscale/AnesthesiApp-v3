import { NextResponse } from "next/server"
import { DEFAULT_AI_MODEL } from "@/lib/ai-models"
import { callAiModel } from "@/lib/ai"
import { createClient } from "@/lib/supabase/server"

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
  let body: {
    messages?: { role: "user" | "assistant" | "system"; content: string }[]
    scenario: string
    instructions: string
    rubric: any[]
    equipment: string[]
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

  let reply: string
  try {
    const aiResult = await callAiModel({
      model: DEFAULT_AI_MODEL,
      temperature: 0.7,
      origin,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    })
    reply = aiResult.content
  } catch (err: any) {
    console.error("[OSCE Chat] AI call failed:", err)
    return NextResponse.json({ error: err.message || "Failed to call AI model" }, { status: 502 })
  }

  return NextResponse.json({ reply })
}
