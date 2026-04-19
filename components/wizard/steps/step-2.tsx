"use client"

import { useFormContext } from "react-hook-form"
import type { CaseData } from "@/lib/schema"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FieldRow } from "../field-row"

export function Step2() {
  const {
    register,
    formState: { errors },
  } = useFormContext<CaseData>()

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-xl font-semibold tracking-tight">Clinical Assessment</h2>
        <p className="text-sm text-muted-foreground">Diagnosis, procedure, and subjective history.</p>
      </header>

      <FieldRow label="Diagnosis" htmlFor="diagnosis" required error={errors.diagnosis?.message}>
        <Textarea id="diagnosis" rows={3} {...register("diagnosis")} placeholder="Primary diagnosis" />
      </FieldRow>

      <FieldRow
        label="Procedure / Intervention"
        htmlFor="procedure_intervention"
        required
        error={errors.procedure_intervention?.message}
      >
        <Input id="procedure_intervention" {...register("procedure_intervention")} placeholder="Planned surgical procedure" />
      </FieldRow>

      <section className="flex flex-col gap-4 rounded-lg border border-border bg-muted/30 p-4">
        <h3 className="text-sm font-semibold">Subjective</h3>

        <FieldRow label="Allergy" htmlFor="allergy">
          <Textarea id="allergy" rows={2} {...register("allergy")} placeholder="Known allergies" />
        </FieldRow>
        <FieldRow label="Medication" htmlFor="medication">
          <Textarea id="medication" rows={2} {...register("medication")} placeholder="Current medications" />
        </FieldRow>
        <FieldRow label="Past Illness" htmlFor="past_illness">
          <Textarea id="past_illness" rows={2} {...register("past_illness")} placeholder="Relevant past illness" />
        </FieldRow>
        <FieldRow label="Last Meal" htmlFor="last_meal" hint="Time or description">
          <Input id="last_meal" {...register("last_meal")} placeholder="e.g. 2024-05-01 07:30 — clear liquids" />
        </FieldRow>
        <FieldRow label="Event" htmlFor="event">
          <Textarea id="event" rows={2} {...register("event")} placeholder="Present illness / event history" />
        </FieldRow>
      </section>
    </div>
  )
}
