"use client"

import { useFormContext } from "react-hook-form"
import type { CaseData } from "@/lib/schema"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FieldRow } from "../field-row"

export function Step5() {
  const { register } = useFormContext<CaseData>()

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-xl font-semibold tracking-tight">Anesthesia Management</h2>
        <p className="text-sm text-muted-foreground">Regimen and analgesia plan.</p>
      </header>

      <FieldRow label="Anesthesia Management" htmlFor="anesthesia_management">
        <Textarea
          id="anesthesia_management"
          rows={3}
          {...register("anesthesia_management")}
          placeholder="General / Regional / Sedation — description"
        />
      </FieldRow>

      <section className="flex flex-col gap-4 rounded-lg border border-border bg-muted/30 p-4">
        <h3 className="text-sm font-semibold">Regimen</h3>
        <FieldRow label="Pre-induction" htmlFor="regimen_pre_induction">
          <Input id="regimen_pre_induction" {...register("regimen_pre_induction")} placeholder="Pre-medication, monitoring" />
        </FieldRow>
        <FieldRow label="Induction" htmlFor="regimen_induction">
          <Input id="regimen_induction" {...register("regimen_induction")} placeholder="Induction agents & doses" />
        </FieldRow>
        <FieldRow label="Maintenance" htmlFor="regimen_maintenance">
          <Input id="regimen_maintenance" {...register("regimen_maintenance")} placeholder="Maintenance agents" />
        </FieldRow>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-border bg-muted/30 p-4">
        <h3 className="text-sm font-semibold">Analgesia</h3>
        <FieldRow label="Pre-Operative" htmlFor="analgesia_pre_op">
          <Input id="analgesia_pre_op" {...register("analgesia_pre_op")} />
        </FieldRow>
        <FieldRow label="Intra-Operative" htmlFor="analgesia_intra_op">
          <Input id="analgesia_intra_op" {...register("analgesia_intra_op")} />
        </FieldRow>
        <FieldRow label="Post-Operative" htmlFor="analgesia_post_op">
          <Input id="analgesia_post_op" {...register("analgesia_post_op")} />
        </FieldRow>
      </section>
    </div>
  )
}
