"use client"

import { useFormContext } from "react-hook-form"
import type { CaseData } from "@/lib/schema"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FieldRow } from "../field-row"

const ROOMS = ["Low Care", "High Care", "ICU"] as const

export function Step7() {
  const { register, watch, setValue } = useFormContext<CaseData>()
  const room = watch("post_op_room")

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-xl font-semibold tracking-tight">Post-Operative</h2>
        <p className="text-sm text-muted-foreground">Recovery location and post-op status.</p>
      </header>

      <FieldRow label="Post-Op Room">
        <Select
          value={room ?? ""}
          onValueChange={(v) => setValue("post_op_room", v as (typeof ROOMS)[number], { shouldDirty: true })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select destination" />
          </SelectTrigger>
          <SelectContent>
            {ROOMS.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldRow>

      <FieldRow label="Hemodynamics" htmlFor="hemodynamics_post">
        <Textarea id="hemodynamics_post" rows={3} {...register("hemodynamics_post")} placeholder="Post-op BP/HR, stability" />
      </FieldRow>

      <FieldRow label="Laboratory Results" htmlFor="lab_results_post">
        <Textarea id="lab_results_post" rows={3} {...register("lab_results_post")} placeholder="Post-op labs" />
      </FieldRow>

      <div className="border-t border-border pt-4 mt-2">
        <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <input
            id="is_shared"
            type="checkbox"
            className="h-4 w-4 mt-0.5 rounded border-input text-primary focus:ring-primary focus:ring-offset-background"
            {...register("is_shared")}
          />
          <div className="flex flex-col gap-1">
            <label htmlFor="is_shared" className="text-sm font-semibold text-foreground cursor-pointer">
              Share Case anonymously for Clinical Research
            </label>
            <p className="text-xs text-muted-foreground leading-normal">
              By checking this, you allow other practitioners to view this case study in the Research Library. Your patient's name will automatically be hidden to preserve patient confidentiality.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
