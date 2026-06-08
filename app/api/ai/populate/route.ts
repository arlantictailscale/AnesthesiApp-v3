import { NextResponse, after } from "next/server"
import { AI_MODELS, DEFAULT_AI_MODEL, type AiModelId } from "@/lib/ai-models"
import { callAiModel } from "@/lib/ai"
import { createClient } from "@/lib/supabase/server"

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

CRITICAL LANGUAGE CONSTRAINT:
- **DO NOT TRANSLATE TO ENGLISH**.
- If the input text is in Indonesian (or any other language), the output text fields MUST remain in that language. 
- Keep the exact medical phrasing and terminology used in the original notes (e.g., if input says "bising usus (+)", output "bising usus (+)" or "bising usus positif". Do NOT convert to "bowel sounds present" or "normal bowel sounds").
- Preserving the input language is a strict clinical requirement for all text fields. Do NOT translate any terms to English.

Rules:
- Output ONLY the JSON object. No markdown fences, no explanation.
- Use empty strings for unknown text fields, null for unknown numbers, false for unknown investigation "enabled" flags.
- For investigations: set "enabled": true ONLY if the note mentions that study was obtained; copy the finding into "result".
- Do not invent clinical details; only use what is supported by the input.
- Keep values concise and clinically phrased (e.g., "ASA II", "GCS 15", "BP 120/80, HR 82, SpO2 99% RA").
- Dates must be ISO YYYY-MM-DD. If only a relative date is given (e.g., "today"), leave it empty.
- **List items**: For fields that contain multiple items or bullet points (such as "allergy", "medication", "past_illness", "assessment", or "planning"), separate the items using semicolons with spaces (" ; "). For example: "ASA II ; G2P1001Ab000 ; Anemia" or "Informed consent ; IV line 18G ; IVFD RL 100cc/jam ; Puasa 6 jam".

EXAMPLE INPUT:
"Assalamualaikum warahmatullahi wabarakatuh dokter, mohon izin mengonsultasikan pasien lantai 5 OK Obgyn, Jumat, 9 Mei 2025, sbb:

*Identitas*
Ny. Supiyah / P / 49th / 12026701 / Ranukumbolo C2

*Diagnosis*
Mioma Uteri Submukosa

*Tindakan*
Total Laparoscopic Hysterectomy

BB = 40 kg
TB = 147 cm
BMI = 18,5

*Subyektif :*
A :  (-)
M : (-)
P : HT (+) Amlodipine 10 mg, DM (-), Asma (-), riwayat penyakit jantung (-), riwayat CVA (-) riwayat operasi (-) 
L : direncanakan puasa 6 jam makanan padat, 2 jam air putih preop
E : pasien mengeluh setiap mens berdarah banyak sudah sejak 3 bulan yll, benjolan (-), dikatakan ada miom, rencana histerektomi
Demam (-) batuk (-) pilek (-) sesak (-) ngongsrong

*Obyektif :*
B1. Airway paten, nafas spontan, BM 3 jari, mallampati 2, gigi palsu (-), jarak TMD 7 cm, RR 18 x/mnt, SpO2 96% RA, vesikuler +/+, rhonki -/-, wheezing -/-, gerak leher flexi (+) ekstensi (+) bebas
B2. AHKM (+), CRT < 2 detik, TD 139/88 mmHg, N 69 x/menit, reguler, kuat angkat (+), S1-S2 tunggal, murmur (-), gallop (-), T 36,6
B3. GCS 456, lateralisasi (-)
B4. BAK (+) spontan 
B5. BU (+) N, distended abdomen (-) massa (-)
B6. Edema (-/-), sianosis (-/-)

*Penunjang :* 
*Laboratorium 8/5/25*
SE 138/3,86/102
DL 12,8/8,540/40,20/180,000
PPT 10,40/12,0/1,00
APTT 28,30/25,3
OT/PT 24/16
Albumin 4,24
GDS 156
Ur/Cr 26,4/0,68

*CXR 8/5/25*
Cor dan pulmo dalam batas normal

*EKG 8/5/25*
Sinus rhythm 70x/min

*Assesment*
ASA 2
Susp. Malignancy dt myoma uteri
HT stg 1 on treatment (TD 139/88)

*Planning*
1. Informed consent
2. Pasang IV line 1 jalur No. 18G
3. IVFD RL 80cc/jam selama puasa
4. Puasa minimal 6 jam makanan padat, 2 jam air putih preop
5. Premedikasi : Metoclopramide 10mg, Ranitidine 50 mg IV (1 jam pre op)
6. Regulasi TD, Amlodipine malam 10mg tetap diminum, cek TD pagi target TDS 110-180, TDD 70-110
7. Sedia darah 1 PRC
8. Post op ke ruangan

*Management Anestesi :*
Izin kami kerjakan dengan GA Intubasi

Regimen
Midazolam 2 mg
Fentanyl 100 mcg 
Propofol 80 mg
Atracurium 20 mg 

Maintenance Isoflurane

Analgesia preop : Ketorolac 30 mg 
Analgesia durante op : fentanyl Intermitten
Analgetik post op : Ketorolac 3x30 mg IV + Paracetamol 3x500mg"

EXAMPLE OUTPUT:
{
  "procedure_date": "2025-05-09",
  "patient_name": "Ny. Supiyah",
  "sex": "Female",
  "age": 49,
  "medical_record_number": "12026701",
  "room": "Ranukumbolo C2",
  "weight_kg": 40,
  "height_cm": 147,
  "diagnosis": "Mioma Uteri Submukosa",
  "procedure_intervention": "Total Laparoscopic Hysterectomy",
  "allergy": "",
  "medication": "Amlodipine 10 mg",
  "past_illness": "HT (+)",
  "last_meal": "direncanakan puasa 6 jam makanan padat, 2 jam air putih preop",
  "event": "pasien mengeluh setiap mens berdarah banyak sudah sejak 3 bulan yll, benjolan (-), dikatakan ada miom, rencana histerektomi",
  "b1_breathing": "Airway paten , nafas spontan , BM 3 jari , mallampati 2 , gigi palsu (-) , jarak TMD 7 cm , RR 18 x/mnt , SpO2 96% RA , vesikuler +/+ , rhonki -/- , wheezing -/- , gerak leher flexi (+) ekstensi (+) bebas",
  "b2_blood": "AHKM (+) , CRT < 2 detik , TD 139/88 mmHg , N 69 x/menit , reguler , kuat angkat (+) , S1-S2 tunggal , murmur (-) , gallop (-) , T 36,6",
  "b3_brain": "GCS 15 (456) , lateralisasi (-)",
  "b4_bladder": "BAK (+) spontan",
  "b5_bowel": "BU (+) N , distended abdomen (-) , massa (-)",
  "b6_body_temp": "Edema (-/-) , sianosis (-/-)",
  "others": "",
  "inv_laboratory": {
    "enabled": true,
    "result": "SE 138/3,86/102 ; DL 12,8/8,540/40,20/180,000 ; PPT 10,40/12,0/1,00 ; APTT 28,30/25,3 ; OT/PT 24/16 ; Albumin 4,24 ; GDS 156 ; Ur/Cr 26,4/0,68"
  },
  "inv_xray": {
    "enabled": true,
    "result": "Cor dan pulmo dalam batas normal"
  },
  "inv_ecg": {
    "enabled": true,
    "result": "Sinus rhythm 70x/min"
  },
  "inv_ct": {
    "enabled": false,
    "result": ""
  },
  "inv_mri": {
    "enabled": false,
    "result": ""
  },
  "inv_other_label": "",
  "inv_other_result": "",
  "assessment": "ASA 2 ; Susp. Malignancy dt myoma uteri ; HT stg 1 on treatment (TD 139/88)",
  "planning": "Informed consent ; Pasang IV line 1 jalur No. 18G ; IVFD RL 80cc/jam selama puasa ; Puasa minimal 6 jam makanan padat, 2 jam air putih preop ; Premedikasi : Metoclopramide 10mg, Ranitidine 50 mg IV (1 jam pre op) ; Regulasi TD, Amlodipine malam 10mg tetap diminum, cek TD pagi target TDS 110-180, TDD 70-110 ; Sedia darah 1 PRC ; Post op ke ruangan",
  "anesthesia_management": "GA Intubasi",
  "regimen_pre_induction": "",
  "regimen_induction": "Midazolam 2 mg ; Fentanyl 100 mcg ; Propofol 80 mg ; Atracurium 20 mg",
  "regimen_maintenance": "Isoflurane",
  "analgesia_pre_op": "Ketorolac 30 mg",
  "analgesia_intra_op": "fentanyl Intermitten",
  "analgesia_post_op": "Ketorolac 3x30 mg IV + Paracetamol 3x500mg",
  "post_induction_side_effects": "",
  "ventilator_settings": "",
  "hemodynamics_intra": "",
  "duration_surgery": "",
  "bleeding": "",
  "transfusion": "",
  "urine_output": "",
  "fluid_balance": "",
  "post_op_room": "Low Care",
  "hemodynamics_post": "",
  "lab_results_post": ""
}

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

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Insert a shell record with status = 'processing'
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
    console.error("[v0] Initial case insert failed:", insertError)
    return NextResponse.json(
      { error: insertError?.message || "Failed to create draft case" },
      { status: 500 },
    )
  }

  after(async () => {
    try {
      const aiResult = await callAiModel({
        model,
        temperature: 0.1,
        jsonMode: true,
        origin,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: description },
        ],
      })
      const content = aiResult.content
      if (!content) {
        throw new Error("Empty response from AI model")
      }

      let parsed: any
      try {
        parsed = extractJson(content)
      } catch (err) {
        console.error("[v0] Failed to parse model JSON:", content)
        throw err
      }

      // Defensive parsing and coercion of LLM values
      const parsedUpdate: Record<string, any> = {}

      // String columns
      const stringKeys = [
        "procedure_date", "patient_name", "sex", "medical_record_number", "room",
        "diagnosis", "procedure_intervention", "allergy", "medication", "past_illness",
        "last_meal", "event", "b1_breathing", "b2_blood", "b3_brain", "b4_bladder",
        "b5_bowel", "b6_body_temp", "others", "inv_other_label", "inv_other_result",
        "assessment", "planning", "anesthesia_management", "regimen_pre_induction",
        "regimen_induction", "regimen_maintenance", "analgesia_pre_op", "analgesia_intra_op",
        "analgesia_post_op", "post_induction_side_effects", "ventilator_settings",
        "hemodynamics_intra", "duration_surgery", "bleeding", "transfusion", "urine_output",
        "fluid_balance", "post_op_room", "hemodynamics_post", "lab_results_post"
      ]

      for (const key of stringKeys) {
        if (key in parsed) {
          const val = parsed[key]
          if (val === null || val === undefined) {
            parsedUpdate[key] = ""
          } else {
            parsedUpdate[key] = String(val).trim()
          }
        }
      }

      // Numeric columns
      const numericKeys = ["age", "weight_kg", "height_cm"]
      for (const key of numericKeys) {
        if (key in parsed) {
          const val = parsed[key]
          if (val === null || val === undefined || val === "") {
            parsedUpdate[key] = null
          } else {
            const num = Number(val)
            parsedUpdate[key] = Number.isFinite(num) ? num : null
          }
        }
      }

      // JSONB investigations columns
      const jsonbKeys = ["inv_laboratory", "inv_xray", "inv_ecg", "inv_ct", "inv_mri"]
      for (const key of jsonbKeys) {
        if (key in parsed) {
          const val = parsed[key]
          if (val && typeof val === "object") {
            const enabled = (val as any).enabled === true || (val as any).enabled === "true"
            const result = typeof (val as any).result === "string" ? (val as any).result.trim() : ""
            parsedUpdate[key] = { enabled, result }
          } else {
            parsedUpdate[key] = { enabled: false, result: "" }
          }
        }
      }

      // Normalize and validate sex check constraint
      const rawSex = String(parsedUpdate.sex || "").trim().toLowerCase();
      if (["l", "l/p", "laki", "laki-laki", "male", "m"].includes(rawSex)) {
        parsedUpdate.sex = "Male";
      } else if (["p", "perempuan", "female", "f"].includes(rawSex)) {
        parsedUpdate.sex = "Female";
      } else {
        parsedUpdate.sex = null;
      }

      // Normalize and validate post_op_room check constraint
      const rawPostOp = String(parsedUpdate.post_op_room || "").trim().toLowerCase();
      if (rawPostOp.includes("icu")) {
        parsedUpdate.post_op_room = "ICU";
      } else if (rawPostOp.includes("high care") || rawPostOp.includes("hcu")) {
        parsedUpdate.post_op_room = "High Care";
      } else if (
        rawPostOp.includes("low care") ||
        rawPostOp.includes("ruangan") ||
        rawPostOp.includes("ruang") ||
        rawPostOp.includes("ward") ||
        rawPostOp.includes("room")
      ) {
        parsedUpdate.post_op_room = "Low Care";
      } else {
        parsedUpdate.post_op_room = null;
      }

      // Calculate BMI
      let bmi = null
      const w = parsedUpdate["weight_kg"]
      const h = parsedUpdate["height_cm"]
      if (typeof w === "number" && typeof h === "number" && h > 0) {
        const heightM = h / 100
        bmi = Number((w / (heightM * heightM)).toFixed(1))
      }
      parsedUpdate["bmi"] = bmi

      const { error: updateError } = await supabase
        .from("anesthesia_cases")
        .update({
          ...parsedUpdate,
          status: "completed",
        })
        .eq("id", caseRow.id)

      if (updateError) {
        console.error("[v0] Failed to save AI populated case to DB:", updateError)
        await supabase
          .from("anesthesia_cases")
          .update({ status: "failed", error_message: updateError.message })
          .eq("id", caseRow.id)
      }
    } catch (err: any) {
      console.error("[v0] Background AI populate failed:", err)
      const errMsg = err instanceof Error ? err.message : String(err)
      await supabase
        .from("anesthesia_cases")
        .update({ status: "failed", error_message: errMsg })
        .eq("id", caseRow.id)
    }
  })

  return NextResponse.json({ success: true, caseId: caseRow.id })
}
