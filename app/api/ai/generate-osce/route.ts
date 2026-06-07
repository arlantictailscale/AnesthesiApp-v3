import { NextResponse } from "next/server"
import { DEFAULT_AI_MODEL } from "@/lib/ai-models"
import { callAiModel } from "@/lib/ai"

export const runtime = "nodejs"
export const maxDuration = 60

const SYSTEM_PROMPT = `You are a clinical anesthesiology education assistant for AnesthesiApp.
Your job: Generate a complete, highly authentic Objective Structured Clinical Examination (OSCE) exam station to prepare candidates for the Indonesian Anesthesiologist National Board Examination.
All content must be in Bahasa Indonesia using appropriate medical terminology.

The station must categorize under one of these ten groups exactly:
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

Return ONLY a single valid JSON object (no markdown code blocks, no trailing comments, no introductory prose) representing the OSCE station details.

JSON schema template:
{
  "title": "Judul Stasiun Ujian (e.g. Anestesia Obstetrik – Sectio Caesarea & Appendiktomi)",
  "category": "Anestesi Obstetrik",
  "duration_minutes": 17,
  "scenario": "Skenario klinis lengkap berisi umur pasien, berat badan, diagnosis, problem aktual/potensial, vital sign (Tekanan Darah, nadi, napas, suhu), rencana operasi, dan rencana tindakan anestesi...",
  "instructions_participant": "Tugas untuk peserta ujian. Berupa daftar poin (e.g. - Sebutkan problem...\\n- Sebutkan persiapan...\\n- Lakukan tindakan...\\n- Sebutkan manajemen nyeri...)",
  "instructions_examiner": "Instruksi khusus untuk penguji (e.g. Pastikan identitas peserta ujian. Amati dan berikan skor sesuai rubrik.)",
  "equipment": [
    "Daftar alat 1",
    "Daftar alat 2",
    "Obat-obatan 1",
    "Obat-obatan 2"
  ],
  "rubric": [
    {
      "aspect": "Aspek Penilaian 1 (e.g. Diagnosis dan problem aktual - potensial)",
      "weight": 2,
      "items": [
        "Poin detail checklist 1",
        "Poin detail checklist 2"
      ]
    },
    {
      "aspect": "Aspek Penilaian 2 (e.g. Keterampilan klinis - Teknik Anestesi)",
      "weight": 3,
      "items": [
        "Langkah detail checklist 1",
        "Langkah detail checklist 2",
        "Langkah detail checklist 3"
      ]
    }
  ]
}

Note:
1. In the rubric array, there should be 4 to 6 assessment aspects covering:
   - Problem/Diagnosis recognition
   - Preparation / Anesthesia Plan
   - Clinical Skills (performing or explaining anesthesia technique)
   - Postoperative Pain Management
   - Communication and Professional behavior
2. Aspect weights should be integers between 1 and 3 depending on clinical significance (e.g. Clinical Skills usually gets weight 3, diagnosis/problems gets weight 2, and others get weight 1).
3. Checklists should have detailed concrete items in Bahasa Indonesia to verify candidates' performance.
`

function extractJson(text: string): unknown {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  const body = fenced ? fenced[1] : trimmed
  const firstBrace = body.indexOf("{")
  const lastBrace = body.lastIndexOf("}")
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("Model did not return a JSON object")
  }
  return JSON.parse(body.slice(firstBrace, lastBrace + 1))
}

export async function POST(req: Request) {
  let body: { topic?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const topic = (body.topic ?? "").trim()
  if (!topic) {
    return NextResponse.json({ error: "Topic is required" }, { status: 400 })
  }

  const origin = req.headers.get("origin") ?? "https://anesthesiapp.local"

  const userPrompt = `Hasilkan satu stasiun stasion OSCE anestesiologi yang lengkap, mendalam, dan menantang untuk topik/materi: "${topic}". Pastikan format sesuai skema JSON stasiun OSCE tunggal.`

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
    console.error("[OSCE Generator] AI call failed:", err)
    return NextResponse.json({ error: err.message || "Failed to call AI model" }, { status: 502 })
  }

  if (!content) {
    return NextResponse.json({ error: "Empty response from model" }, { status: 502 })
  }

  let parsed: unknown
  try {
    parsed = extractJson(content)
  } catch (err) {
    console.error("[OSCE Generator] Failed to parse model JSON:", content)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to parse JSON" },
      { status: 502 },
    )
  }

  return NextResponse.json({ station: parsed })
}
