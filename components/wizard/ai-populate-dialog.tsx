"use client"

import { useState } from "react"
import { useFormContext } from "react-hook-form"
import { toast } from "sonner"
import { Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AI_MODELS, DEFAULT_AI_MODEL, type AiModelId } from "@/lib/ai-models"
import type { CaseData } from "@/lib/schema"

type RawAiData = Partial<Record<keyof CaseData, unknown>>

const INVESTIGATION_KEYS = [
  "inv_laboratory",
  "inv_xray",
  "inv_ecg",
  "inv_ct",
  "inv_mri",
] as const

const NUMERIC_KEYS: (keyof CaseData)[] = ["age", "weight_kg", "height_cm"]

const STRING_KEYS: (keyof CaseData)[] = [
  "procedure_date",
  "patient_name",
  "medical_record_number",
  "room",
  "diagnosis",
  "procedure_intervention",
  "allergy",
  "medication",
  "past_illness",
  "last_meal",
  "event",
  "b1_breathing",
  "b2_blood",
  "b3_brain",
  "b4_bladder",
  "b5_bowel",
  "b6_body_temp",
  "others",
  "inv_other_label",
  "inv_other_result",
  "assessment",
  "planning",
  "anesthesia_management",
  "regimen_pre_induction",
  "regimen_induction",
  "regimen_maintenance",
  "analgesia_pre_op",
  "analgesia_intra_op",
  "analgesia_post_op",
  "post_induction_side_effects",
  "ventilator_settings",
  "hemodynamics_intra",
  "duration_surgery",
  "bleeding",
  "transfusion",
  "urine_output",
  "fluid_balance",
  "hemodynamics_post",
  "lab_results_post",
]

export function AiPopulateDialog({
  onPopulated,
}: {
  onPopulated?: (count: number) => void
}) {
  const form = useFormContext<CaseData>()
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState("")
  const [model, setModel] = useState<AiModelId>(DEFAULT_AI_MODEL)
  const [loading, setLoading] = useState(false)

  function applyToForm(data: RawAiData) {
    let appliedCount = 0

    // Strings
    for (const key of STRING_KEYS) {
      const v = data[key]
      if (typeof v === "string" && v.trim()) {
        form.setValue(key as never, v as never, { shouldDirty: true })
        appliedCount++
      }
    }

    // Sex enum
    if (data.sex === "Male" || data.sex === "Female") {
      form.setValue("sex", data.sex, { shouldDirty: true })
      appliedCount++
    }

    // Post-op room enum
    const room = data.post_op_room
    if (room === "Low Care" || room === "High Care" || room === "ICU") {
      form.setValue("post_op_room", room, { shouldDirty: true })
      appliedCount++
    }

    // Numbers
    for (const key of NUMERIC_KEYS) {
      const v = data[key]
      if (typeof v === "number" && Number.isFinite(v)) {
        form.setValue(key as never, v as never, { shouldDirty: true })
        appliedCount++
      } else if (typeof v === "string" && v.trim() !== "") {
        const n = Number(v)
        if (Number.isFinite(n)) {
          form.setValue(key as never, n as never, { shouldDirty: true })
          appliedCount++
        }
      }
    }

    // Investigations
    for (const key of INVESTIGATION_KEYS) {
      const inv = data[key]
      if (inv && typeof inv === "object") {
        const enabled = (inv as { enabled?: unknown }).enabled === true
        const result = typeof (inv as { result?: unknown }).result === "string"
          ? ((inv as { result?: string }).result as string)
          : ""
        if (enabled || result.trim()) {
          form.setValue(
            key as never,
            { enabled: enabled || !!result.trim(), result } as never,
            { shouldDirty: true },
          )
          appliedCount++
        }
      }
    }

    return appliedCount
  }

  async function handleGenerate() {
    const trimmed = description.trim()
    if (!trimmed) {
      toast.error("Please describe the case first.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/ai/populate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: trimmed, model }),
      })
      const json = (await res.json()) as { data?: RawAiData; error?: string }
      if (!res.ok || !json.data) {
        throw new Error(json.error || `Request failed (${res.status})`)
      }
      const applied = applyToForm(json.data)
      toast.success(`AI populated ${applied} field${applied === 1 ? "" : "s"}`)
      onPopulated?.(applied)
      setOpen(false)
    } catch (err) {
      console.error("[v0] AI populate error:", err)
      toast.error(err instanceof Error ? err.message : "AI populate failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="gap-1.5">
          <Sparkles className="h-4 w-4 text-[color:var(--brand-crimson)]" />
          AI populate
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[color:var(--brand-crimson)]" />
            Auto-populate case with AI
          </DialogTitle>
          <DialogDescription>
            Paste a free-text case description, handover note, or rough bullets. The AI will extract
            structured values into every step of the form. You can edit anything before submitting.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ai-model">Model</Label>
            <Select value={model} onValueChange={(v) => setModel(v as AiModelId)}>
              <SelectTrigger id="ai-model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel className="font-bold text-xs uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Free Models</SelectLabel>
                  {AI_MODELS.filter(m => m.tier === "free").map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <div className="flex flex-col py-0.5">
                        <span className="font-medium text-sm text-foreground">{m.label}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{m.id}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
                
                <SelectSeparator />
                
                <SelectGroup>
                  <SelectLabel className="font-bold text-xs uppercase text-amber-600 dark:text-amber-400 tracking-wider">Paid Models (Sorted by Price)</SelectLabel>
                  {AI_MODELS.filter(m => m.tier === "paid").map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <div className="flex flex-col py-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-sm text-foreground">{m.label}</span>
                          <span className="text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full px-1.5 py-0.2 font-mono font-semibold">
                            {m.priceLabel}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">{m.id}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-1.5">
            <Label htmlFor="ai-description">Case description</Label>
            <Textarea
              id="ai-description"
              rows={9}
              placeholder={`e.g. 45y female, MRN 11823, scheduled for laparoscopic cholecystectomy in OR 3 on 2026-04-21. Weight 68kg, height 162cm. Allergies: penicillin. PMH: HTN on amlodipine. NPO since midnight. Airway: Mallampati II. Labs WNL, ECG normal sinus. Plan GA with propofol induction, sevoflurane maintenance, fentanyl analgesia. Post-op: Low Care.`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              className="max-h-[50vh] min-h-40 resize-y font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Only fields the model can extract will be filled; existing values stay untouched if
              the AI has nothing to say about them.
            </p>
          </div>
        </div>

        <DialogFooter className="border-t bg-background px-6 py-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleGenerate} disabled={loading} className="gap-1.5">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
