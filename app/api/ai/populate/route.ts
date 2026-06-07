import { NextResponse } from "next/server"
import { AI_MODELS, DEFAULT_AI_MODEL, type AiModelId } from "@/lib/ai-models"
import { callAiModel } from "@/lib/ai"

export const runtime = "nodejs"
export const maxDuration = 60

const FIELD_SCHEMA_DOC = `
Return ONLY a single JSON object (no markdown, no prose) with EXACTLY these keys.
Any field the source text does not mention should be an empty string "" (or \`false\` for the investigation "enabled" booleans).
Numeric fields (age, weight_kg, height_cm) should be JSON numbers when known, otherwise null.

{
  "procedure_date": "YYYY-MM-DD",
  "patient_name": "string",
  "sex": "Male" | "Female" | "",
  "age": number | null,
  "medical_record_number": "string",
  "room": "string",
  "weight_kg": number | null,
  "height_cm": number | null,

  "diagnosis": "string",
  "procedure_intervention": "string",
  "allergy": "string",
  "medication": "string",
  "past_illness": "string",
  "last_meal": "string",
  "event": "string",

  "b1_breathing": "string (B1 - airway/breathing findings)",
  "b2_blood": "string (B2 - circulation/blood findings)",
  "b3_brain": "string (B3 - neurological findings)",
  "b4_bladder": "string (B4 - renal/urinary findings)",
  "b5_bowel": "string (B5 - GI/abdominal findings)",
  "b6_body_temp": "string (B6 - body temperature / skin)",
  "others": "string",

  "inv_laboratory": { "enabled": boolean, "result": "string" },
  "inv_xray":       { "enabled": boolean, "result": "string" },
  "inv_ecg":        { "enabled": boolean, "result": "string" },
  "inv_ct":         { "enabled": boolean, "result": "string" },
  "inv_mri":        { "enabled": boolean, "result": "string" },
  "inv_other_label": "string",
  "inv_other_result": "string",
  "assessment": "string",
  "planning": "string",

  "anesthesia_management": "string (e.g., GA, regional, MAC)",
  "regimen_pre_induction": "string",
  "regimen_induction": "string",
  "regimen_maintenance": "string",
  "analgesia_pre_op": "string",
  "analgesia_intra_op": "string",
  "analgesia_post_op": "string",

  "post_induction_side_effects": "string",
  "ventilator_settings": "string",
  "hemodynamics_intra": "string",
  "duration_surgery": "string",
  "bleeding": "string",
  "transfusion": "string",
  "urine_output": "string",
  "fluid_balance": "string",

  "post_op_room": "Low Care" | "High Care" | "ICU" | "",
  "hemodynamics_post": "string",
  "lab_results_post": "string"
}
`.trim()

const SYSTEM_PROMPT = `You are a clinical documentation assistant for AnesthesiApp, an anesthesia case logging tool.
Your job: read the provided free-text case description (or rough notes) and extract structured values into the exact JSON schema requested.
Rules:
- Output ONLY the JSON object. No markdown fences, no explanation.
- Use empty strings for unknown text fields, null for unknown numbers, false for unknown investigation "enabled" flags.
- For investigations: set "enabled": true ONLY if the note mentions that study was obtained; copy the finding into "result".
- Do not invent clinical details; only use what is supported by the input.
- Keep values concise and clinically phrased (e.g., "ASA II", "GCS 15", "BP 120/80, HR 82, SpO2 99% RA").
- Dates must be ISO YYYY-MM-DD. If only a relative date is given (e.g., "today"), leave it empty.
- **Language**: Preserve the original language of the input description (e.g., if the clinical notes are in Indonesian, extract and output the values in Indonesian). Do NOT translate the content to English if the input is in another language.
- **List items**: For fields that contain multiple items or bullet points (such as "allergy", "medication", "past_illness", "assessment", or "planning"), separate the items using semicolons with spaces (" ; "). For example: "ASA II ; G2P1001Ab000 ; Anemia" or "Informed consent ; IV line 18G ; IVFD RL 100cc/jam ; Puasa 6 jam".

${FIELD_SCHEMA_DOC}`

function isAllowedModel(id: string): id is AiModelId {
  return AI_MODELS.some((m) => m.id === id)
}

function extractJson(text: string): unknown {
  const trimmed = text.trim()
  // Strip ```json fences if the model added them despite instructions.
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  const body = fenced ? fenced[1] : trimmed
  const firstBrace = body.indexOf("{")
  const lastBrace = body.lastIndexOf("}")
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("Model did not return JSON")
  }
  return JSON.parse(body.slice(firstBrace, lastBrace + 1))
}

export async function POST(req: Request) {
  let body: { description?: string; model?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const description = (body.description ?? "").trim()
  if (!description) {
    return NextResponse.json({ error: "Description is required" }, { status: 400 })
  }

  const requestedModel = body.model ?? DEFAULT_AI_MODEL
  const model: AiModelId = isAllowedModel(requestedModel) ? requestedModel : DEFAULT_AI_MODEL

  const origin = req.headers.get("origin") ?? "https://anesthesiapp.local"

  let content: string
  try {
    const aiResult = await callAiModel({
      model,
      temperature: 0.2,
      jsonMode: true,
      origin,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: description },
      ],
    })
    content = aiResult.content
  } catch (err: any) {
    console.error("[v0] AI call failed:", err)
    return NextResponse.json({ error: err.message || "Failed to call AI model" }, { status: 502 })
  }

  if (!content) {
    return NextResponse.json({ error: "Empty response from model" }, { status: 502 })
  }

  let parsed: unknown
  try {
    parsed = extractJson(content)
  } catch (err) {
    console.error("[v0] Failed to parse model JSON:", content)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to parse JSON" },
      { status: 502 },
    )
  }

  return NextResponse.json({ data: parsed, model })
}
