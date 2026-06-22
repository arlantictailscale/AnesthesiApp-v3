import { NextResponse } from "next/server"
import { DEFAULT_AI_MODEL } from "@/lib/ai-models"
import { callAiModel } from "@/lib/ai"

export const runtime = "nodejs"
export const maxDuration = 60

const SYSTEM_PROMPT = `You are a clinical anesthesiology education assistant for AnesthesiApp.
Your job: Generate highly authentic, multiple-choice questions (CBT format) to prepare candidates for the Indonesian Anesthesiologist National Board Examination.
All content must be in Bahasa Indonesia using appropriate medical terminology.

Each question must:
1. Be a high-quality clinical scenario or case (HOTS - High Order Thinking Skills).
2. Have exactly 5 choices (A, B, C, D, E).
3. Have exactly 1 correct option ('A' | 'B' | 'C' | 'D' | 'E').
4. Categorize under one of these ten groups exactly:
   - "Farmakologi & Fisiologi"
   - "Resusitasi & Critical Care"
   - "Anestesi Umum & Regional"
   - "Anestesi Obstetrik"
   - "Anestesi Pediatrik"
   - "Neuroanestesi"
   - "Anestesi Kardiovaskular"
   - "Manajemen Nyeri (Pain Management)"
   - "Anestesi Geriatrik"
   - "Anestesi Rawat Jalan & NORA"
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
  "category": "Farmakologi & Fisiologi" | "Resusitasi & Critical Care" | "Anestesi Umum & Regional" | "Anestesi Obstetrik" | "Anestesi Pediatrik" | "Neuroanestesi" | "Anestesi Kardiovaskular" | "Manajemen Nyeri (Pain Management)" | "Anestesi Geriatrik" | "Anestesi Rawat Jalan & NORA",
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

  let content: string
  try {
    const aiResult = await callAiModel({
      model: DEFAULT_AI_MODEL,
      temperature: 0.7,
      jsonMode: true,
      origin,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    })
    content = aiResult.content
  } catch (err: any) {
    console.error("[CBT Generator] AI call failed:", err)
    return NextResponse.json({ error: err.message || "Failed to call AI model" }, { status: 502 })
  }

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
