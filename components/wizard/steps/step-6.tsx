"use client"

import { useFormContext } from "react-hook-form"
import type { CaseData } from "@/lib/schema"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FieldRow } from "../field-row"

export function Step6() {
  const { register } = useFormContext<CaseData>()

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-xl font-semibold tracking-tight">Intra-Operative Monitoring</h2>
        <p className="text-sm text-muted-foreground">Monitor values and intraoperative events.</p>
      </header>

      <FieldRow label="Post-Induction Side Effects" htmlFor="post_induction_side_effects">
        <Textarea id="post_induction_side_effects" rows={2} {...register("post_induction_side_effects")} />
      </FieldRow>

      <FieldRow label="Ventilator Settings" htmlFor="ventilator_settings">
        <Textarea id="ventilator_settings" rows={2} {...register("ventilator_settings")} placeholder="Mode, Vt, RR, PEEP…" />
      </FieldRow>

      <FieldRow label="Hemodynamics" htmlFor="hemodynamics_intra">
        <Textarea id="hemodynamics_intra" rows={2} {...register("hemodynamics_intra")} placeholder="BP/HR trends" />
      </FieldRow>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FieldRow label="Duration of Surgery" htmlFor="duration_surgery" hint="e.g. 1h 45m or minutes">
          <Input id="duration_surgery" {...register("duration_surgery")} />
        </FieldRow>
        <FieldRow label="Bleeding" htmlFor="bleeding" hint="mL or description">
          <Input id="bleeding" {...register("bleeding")} />
        </FieldRow>
        <FieldRow label="Transfusion" htmlFor="transfusion" hint="Units / mL">
          <Input id="transfusion" {...register("transfusion")} />
        </FieldRow>
        <FieldRow label="Urine Output" htmlFor="urine_output" hint="mL">
          <Input id="urine_output" {...register("urine_output")} />
        </FieldRow>
        <FieldRow label="Fluid Balance" htmlFor="fluid_balance" hint="mL net">
          <Input id="fluid_balance" {...register("fluid_balance")} />
        </FieldRow>
      </div>
    </div>
  )
}
