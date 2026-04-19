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
    </div>
  )
}
