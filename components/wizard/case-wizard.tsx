"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { FormProvider, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  caseSchema,
  type CaseData,
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
  step6Schema,
  step7Schema,
  STEP_TITLES,
} from "@/lib/schema"
import {
  clearDraft,
  createCase,
  getSession,
  loadDraft,
  saveDraft,
} from "@/lib/storage"
import { Stepper } from "./stepper"
import { AiPopulateDialog } from "./ai-populate-dialog"
import { Step1 } from "./steps/step-1"
import { Step2 } from "./steps/step-2"
import { Step3 } from "./steps/step-3"
import { Step4 } from "./steps/step-4"
import { Step5 } from "./steps/step-5"
import { Step6 } from "./steps/step-6"
import { Step7 } from "./steps/step-7"
import { ArrowLeft, ArrowRight, Save, Check } from "lucide-react"

const STEP_SCHEMAS = [
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
  step6Schema,
  step7Schema,
] as const

const STEP_FIELDS: Record<number, (keyof CaseData)[]> = {
  0: [
    "procedure_date",
    "patient_name",
    "sex",
    "age",
    "medical_record_number",
    "room",
    "weight_kg",
    "height_cm",
    "bmi",
  ],
  1: [
    "diagnosis",
    "procedure_intervention",
    "allergy",
    "medication",
    "past_illness",
    "last_meal",
    "event",
  ],
  2: ["b1_breathing", "b2_blood", "b3_brain", "b4_bladder", "b5_bowel", "b6_body_temp", "others"],
  3: [
    "inv_laboratory",
    "inv_xray",
    "inv_ecg",
    "inv_ct",
    "inv_mri",
    "inv_other_label",
    "inv_other_result",
    "assessment",
    "planning",
  ],
  4: [
    "anesthesia_management",
    "regimen_pre_induction",
    "regimen_induction",
    "regimen_maintenance",
    "analgesia_pre_op",
    "analgesia_intra_op",
    "analgesia_post_op",
  ],
  5: [
    "post_induction_side_effects",
    "ventilator_settings",
    "hemodynamics_intra",
    "duration_surgery",
    "bleeding",
    "transfusion",
    "urine_output",
    "fluid_balance",
  ],
  6: ["post_op_room", "hemodynamics_post", "lab_results_post"],
}

const DEFAULT_VALUES: Partial<CaseData> = {
  procedure_date: "",
  patient_name: "",
  age: undefined as unknown as number,
  medical_record_number: "",
  room: "",
  weight_kg: undefined as unknown as number,
  height_cm: undefined as unknown as number,
  bmi: undefined,
  diagnosis: "",
  procedure_intervention: "",
  allergy: "",
  medication: "",
  past_illness: "",
  last_meal: "",
  event: "",
  b1_breathing: "",
  b2_blood: "",
  b3_brain: "",
  b4_bladder: "",
  b5_bowel: "",
  b6_body_temp: "",
  others: "",
  inv_laboratory: { enabled: false, result: "" },
  inv_xray: { enabled: false, result: "" },
  inv_ecg: { enabled: false, result: "" },
  inv_ct: { enabled: false, result: "" },
  inv_mri: { enabled: false, result: "" },
  inv_other_label: "",
  inv_other_result: "",
  assessment: "",
  planning: "",
  anesthesia_management: "",
  regimen_pre_induction: "",
  regimen_induction: "",
  regimen_maintenance: "",
  analgesia_pre_op: "",
  analgesia_intra_op: "",
  analgesia_post_op: "",
  post_induction_side_effects: "",
  ventilator_settings: "",
  hemodynamics_intra: "",
  duration_surgery: "",
  bleeding: "",
  transfusion: "",
  urine_output: "",
  fluid_balance: "",
  hemodynamics_post: "",
  lab_results_post: "",
  is_shared: true,
}

export function CaseWizard() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [aiPopulated, setAiPopulated] = useState(false)

  const methods = useForm<CaseData>({
    resolver: zodResolver(caseSchema) as never,
    mode: "onTouched",
    defaultValues: DEFAULT_VALUES as CaseData,
  })

  // Load draft on mount
  useEffect(() => {
    const draft = loadDraft()
    if (draft) {
      methods.reset({ ...(DEFAULT_VALUES as CaseData), ...draft })
      toast.info("Draft restored")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-calc BMI
  const weight = useWatch({ control: methods.control, name: "weight_kg" })
  const height = useWatch({ control: methods.control, name: "height_cm" })
  useEffect(() => {
    const w = Number(weight)
    const h = Number(height)
    if (w > 0 && h > 0) {
      const m = h / 100
      const bmi = +(w / (m * m)).toFixed(2)
      methods.setValue("bmi", bmi, { shouldValidate: false, shouldDirty: true })
    } else {
      methods.setValue("bmi", undefined, { shouldValidate: false })
    }
  }, [weight, height, methods])

  const currentStepSchema = useMemo(() => STEP_SCHEMAS[step], [step])

  async function goNext() {
    const fields = STEP_FIELDS[step]
    const valid = await methods.trigger(fields as never)
    if (!valid) {
      toast.error("Please fix the errors before continuing.")
      return
    }
    // Extra per-step check via step schema (belt and suspenders)
    const values = methods.getValues()
    const parsed = currentStepSchema.safeParse(values)
    if (!parsed.success) {
      toast.error("Please complete the required fields.")
      return
    }
    setStep((s) => Math.min(s + 1, STEP_TITLES.length - 1))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function goBack() {
    setStep((s) => Math.max(0, s - 1))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function handleSaveDraft() {
    saveDraft(methods.getValues())
    toast.success("Draft saved")
  }

  async function handleSubmitFinal() {
    const values = methods.getValues()
    const parsed = caseSchema.safeParse(values)
    if (!parsed.success) {
      toast.error("Some fields are invalid. Please review all steps.")
      return
    }
    const session = await getSession()
    if (!session) {
      toast.error("You must be signed in.")
      router.replace("/login")
      return
    }
    setSubmitting(true)
    try {
      const rec = await createCase(session.userId, parsed.data)
      clearDraft()
      toast.success("Case saved")
      router.replace(`/cases/${rec.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save case")
    } finally {
      setSubmitting(false)
    }
  }

  const isLastStep = step === STEP_TITLES.length - 1

  return (
    <FormProvider {...methods}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">New case</h1>
            <p className="text-sm text-muted-foreground">
              Fill the 7 steps manually, or let AI pre-fill from a free-text description.
            </p>
          </div>
          <AiPopulateDialog
            onPopulated={(count) => {
              if (count > 0) setAiPopulated(true)
            }}
          />
        </div>

        <Card className="p-4 md:p-6">
          <Stepper current={step} />
        </Card>

        <Card className="p-4 md:p-6">
          {step === 0 && <Step1 />}
          {step === 1 && <Step2 />}
          {step === 2 && <Step3 />}
          {step === 3 && <Step4 />}
          {step === 4 && <Step5 />}
          {step === 5 && <Step6 />}
          {step === 6 && <Step7 />}
        </Card>

        <div className="sticky bottom-0 z-10 -mx-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:mx-0 md:rounded-lg md:border md:px-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={goBack}
              disabled={step === 0}
              className="gap-1"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={handleSaveDraft} className="gap-1">
                <Save className="h-4 w-4" /> Save draft
              </Button>
              {!isLastStep && (
                <Button type="button" variant="outline" onClick={goNext} className="gap-1">
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              )}
              {(isLastStep || aiPopulated) && (
                <Button
                  type="button"
                  onClick={handleSubmitFinal}
                  disabled={submitting}
                  className="gap-1"
                >
                  <Check className="h-4 w-4" />
                  {submitting ? "Saving…" : "Submit case"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </FormProvider>
  )
}
