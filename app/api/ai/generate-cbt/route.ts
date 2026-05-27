import { NextResponse } from "next/server"
import { DEFAULT_AI_MODEL } from "@/lib/ai-models"

export const runtime = "nodejs"
export const maxDuration = 60

const SYSTEM_PROMPT = `You are a clinical anesthesiology education assistant for AnesthesiApp.
Your job: Generate highly authentic, multiple-choice questions (CBT format) to prepare candidates for the Indonesian Anesthesiologist National Board Examination.
All content must be in Bahasa Indonesia using appropriate medical terminology.

Each question must:
1. Be a high-quality clinical scenario or case (HOTS - High Order Thinking Skills).
2. Have exactly 5 choices (A, B, C, D, E).
3. Have exactly 1 correct option ('A' | 'B' | 'C' | 'D' | 'E').
4. Categorize under one of these five groups exactly:
   - "Farmakologi & Fisiologi"
   - "Resusitasi & Critical Care"
   - "Anestesi Umum & Regional"
   - "Anestesi Obstetrik & Pediatrik"
   - "Neuroanestesi & Kardiovaskular"
5. Provide a detailed, highly professional explanation ("explanation") in Bahasa Indonesia summarizing the clinical/pharmacological rationale behind the correct choice.

Return ONLY a single valid JSON array (no markdown code blocks, no trailing comments, no introductory prose) containing the question objects.

JSON schema template for each question:
{
  "id": "string (e.g. ai-q1)",
  "text": "Studi kasus klinis dan pertanyaan...",
  "options": {
    "A": "Pilihan jawaban A...",
    "B": "Pilihan jawaban B...",
    "C": "Pilihan jawaban C...",
    "D": "Pilihan jawaban D...",
    "E": "Pilihan jawaban E..."
  },
  "correctOption": "A" | "B" | "C" | "D" | "E",
  "category": "Farmakologi & Fisiologi" | "Resusitasi & Critical Care" | "Anestesi Umum & Regional" | "Anestesi Obstetrik & Pediatrik" | "Neuroanestesi & Kardiovaskular",
  "explanation": "Penjelasan klinis mendalam..."
}`

function extractJson(text: string): unknown {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  const body = fenced ? fenced[1] : trimmed
  const firstBrace = body.indexOf("[")
  const lastBrace = body.lastIndexOf("]")
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("Model did not return a JSON array")
  }
  return JSON.parse(body.slice(firstBrace, lastBrace + 1))
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "OPENROUTER_API_KEY is not configured" }, { status: 500 })
  }

  let body: { topic?: string; count?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const topic = (body.topic ?? "").trim()
  if (!topic) {
    return NextResponse.json({ error: "Topic is required" }, { status: 400 })
  }

  const count = Math.min(Math.max(body.count ?? 10, 1), 20) // Cap at 20 questions per prompt to prevent timeouts

  const origin = req.headers.get("origin") ?? "https://anesthesiapp.local"

  const userPrompt = `Hasilkan ${count} soal ujian latihan pilihan ganda berkualitas tinggi untuk topik/materi spesifik: "${topic}". Pastikan format sesuai skema JSON yang diminta.`

  let res: Response
  try {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": origin,
        "X-Title": "AnesthesiApp CBT Generator",
      },
      body: JSON.stringify({
        model: DEFAULT_AI_MODEL,
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    })
  } catch (err) {
    console.error("[CBT Generator] OpenRouter fetch failed:", err)
    return NextResponse.json({ error: "Failed to reach OpenRouter" }, { status: 502 })
  }

  if (!res.ok) {
    const errText = await res.text()
    console.error("[CBT Generator] OpenRouter error:", res.status, errText)
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
    return NextResponse.json({ error: "Empty response from model" }, { status: 502 })
  }

  let parsed: unknown
  try {
    parsed = extractJson(content)
  } catch (err) {
    console.error("[CBT Generator] Failed to parse model JSON:", content)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to parse JSON" },
      { status: 502 },
    )
  }

  return NextResponse.json({ questions: parsed })
}
