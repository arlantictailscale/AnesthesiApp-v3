"use client"

import { useFormContext } from "react-hook-form"
import type { CaseData } from "@/lib/schema"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { FieldRow } from "../field-row"

const INVESTIGATIONS: {
  key: "inv_laboratory" | "inv_xray" | "inv_ecg" | "inv_ct" | "inv_mri"
  label: string
}[] = [
  { key: "inv_laboratory", label: "Laboratory" },
  { key: "inv_xray", label: "X-Ray" },
  { key: "inv_ecg", label: "ECG" },
  { key: "inv_ct", label: "CT Scan" },
  { key: "inv_mri", label: "MRI" },
]

export function Step4() {
  const { register, watch, setValue } = useFormContext<CaseData>()

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-xl font-semibold tracking-tight">Investigations & Planning</h2>
        <p className="text-sm text-muted-foreground">
          Select performed investigations and add results.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Investigations</h3>
        <div className="flex flex-col gap-3">
          {INVESTIGATIONS.map(({ key, label }) => {
            const enabled = watch(`${key}.enabled` as never) as boolean
            return (
              <div key={key} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={`${key}_enabled`}
                    checked={!!enabled}
                    onCheckedChange={(v) =>
                      setValue(`${key}.enabled` as never, !!v as never, { shouldDirty: true })
                    }
                  />
                  <Label htmlFor={`${key}_enabled`} className="cursor-pointer font-medium">
                    {label}
                  </Label>
                </div>
                {enabled && (
                  <div className="mt-3">
                    <Input
                      {...register(`${key}.result` as never)}
                      placeholder={`${label} results`}
                    />
                  </div>
                )}
              </div>
            )
          })}

          {/* Other */}
          <div className="rounded-lg border border-border bg-card p-3">
            <Label className="font-medium">Other</Label>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <Input {...register("inv_other_label")} placeholder="Investigation name" />
              <Input {...register("inv_other_result")} placeholder="Result" />
            </div>
          </div>
        </div>
      </section>

      <FieldRow label="Assessment" htmlFor="assessment">
        <Textarea id="assessment" rows={3} {...register("assessment")} placeholder="Clinical assessment" />
      </FieldRow>

      <FieldRow label="Planning" htmlFor="planning">
        <Textarea id="planning" rows={3} {...register("planning")} placeholder="Plan of care" />
      </FieldRow>
    </div>
  )
}
