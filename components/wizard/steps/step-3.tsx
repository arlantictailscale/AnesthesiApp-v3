"use client"

import { useFormContext } from "react-hook-form"
import type { CaseData } from "@/lib/schema"
import { Textarea } from "@/components/ui/textarea"
import { FieldRow } from "../field-row"

const B_FIELDS: {
  name: keyof CaseData
  label: string
  placeholder: string
}[] = [
  { name: "b1_breathing", label: "B1 — Breathing / Airway", placeholder: "Airway assessment, Mallampati, SpO2…" },
  { name: "b2_blood", label: "B2 — Blood / Cardiovascular", placeholder: "BP, HR, rhythm, Hb…" },
  { name: "b3_brain", label: "B3 — Brain / Neurological", placeholder: "GCS, mental status, pupils…" },
  { name: "b4_bladder", label: "B4 — Bladder / Urine Output", placeholder: "Catheter, output, balance…" },
  { name: "b5_bowel", label: "B5 — Bowel / Abdomen / Body", placeholder: "Abdomen exam, BS, peristalsis…" },
  { name: "b6_body_temp", label: "B6 — Body Temperature / Skin", placeholder: "Temp, skin turgor…" },
]

export function Step3() {
  const { register } = useFormContext<CaseData>()

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-xl font-semibold tracking-tight">Objective Examination</h2>
        <p className="text-sm text-muted-foreground">B1–B6 systematic exam.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {B_FIELDS.map((f) => (
          <FieldRow key={f.name} label={f.label} htmlFor={f.name}>
            <Textarea id={f.name} rows={3} {...register(f.name as never)} placeholder={f.placeholder} />
          </FieldRow>
        ))}
      </div>

      <FieldRow label="Others" htmlFor="others">
        <Textarea id="others" rows={3} {...register("others")} placeholder="Additional findings" />
      </FieldRow>
    </div>
  )
}
