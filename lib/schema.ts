import { z } from "zod"

export const step1Schema = z.object({
  procedure_date: z.string().min(1, "Procedure date is required"),
  patient_name: z.string().min(1, "Name is required"),
  sex: z.enum(["Male", "Female"], {
    required_error: "Sex is required",
    invalid_type_error: "Sex is required",
  }),
  age: z.coerce.number().min(0, "Age must be ≥ 0").max(130, "Age must be ≤ 130"),
  medical_record_number: z.string().min(1, "MRN is required"),
  room: z.string().min(1, "Room is required"),
  weight_kg: z.coerce.number().min(0.1, "Weight is required"),
  height_cm: z.coerce.number().min(1, "Height is required"),
  bmi: z.coerce.number().optional(),
})

export const step2Schema = z.object({
  diagnosis: z.string().min(1, "Diagnosis is required"),
  procedure_intervention: z.string().min(1, "Procedure/intervention is required"),
  allergy: z.string().optional().default(""),
  medication: z.string().optional().default(""),
  past_illness: z.string().optional().default(""),
  last_meal: z.string().optional().default(""),
  event: z.string().optional().default(""),
})

export const step3Schema = z.object({
  b1_breathing: z.string().optional().default(""),
  b2_blood: z.string().optional().default(""),
  b3_brain: z.string().optional().default(""),
  b4_bladder: z.string().optional().default(""),
  b5_bowel: z.string().optional().default(""),
  b6_body_temp: z.string().optional().default(""),
  others: z.string().optional().default(""),
})

export const investigationSchema = z.object({
  enabled: z.boolean().default(false),
  result: z.string().optional().default(""),
})

export const step4Schema = z.object({
  inv_laboratory: investigationSchema,
  inv_xray: investigationSchema,
  inv_ecg: investigationSchema,
  inv_ct: investigationSchema,
  inv_mri: investigationSchema,
  inv_other_label: z.string().optional().default(""),
  inv_other_result: z.string().optional().default(""),
  assessment: z.string().optional().default(""),
  planning: z.string().optional().default(""),
})

export const step5Schema = z.object({
  anesthesia_management: z.string().optional().default(""),
  regimen_pre_induction: z.string().optional().default(""),
  regimen_induction: z.string().optional().default(""),
  regimen_maintenance: z.string().optional().default(""),
  analgesia_pre_op: z.string().optional().default(""),
  analgesia_intra_op: z.string().optional().default(""),
  analgesia_post_op: z.string().optional().default(""),
})

export const step6Schema = z.object({
  post_induction_side_effects: z.string().optional().default(""),
  ventilator_settings: z.string().optional().default(""),
  hemodynamics_intra: z.string().optional().default(""),
  duration_surgery: z.string().optional().default(""),
  bleeding: z.string().optional().default(""),
  transfusion: z.string().optional().default(""),
  urine_output: z.string().optional().default(""),
  fluid_balance: z.string().optional().default(""),
})

export const step7Schema = z.object({
  post_op_room: z.enum(["Low Care", "High Care", "ICU"]).optional(),
  hemodynamics_post: z.string().optional().default(""),
  lab_results_post: z.string().optional().default(""),
})

export const caseSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4Schema)
  .merge(step5Schema)
  .merge(step6Schema)
  .merge(step7Schema)

export type CaseData = z.infer<typeof caseSchema>
export type Step1Data = z.infer<typeof step1Schema>
export type Step2Data = z.infer<typeof step2Schema>
export type Step3Data = z.infer<typeof step3Schema>
export type Step4Data = z.infer<typeof step4Schema>
export type Step5Data = z.infer<typeof step5Schema>
export type Step6Data = z.infer<typeof step6Schema>
export type Step7Data = z.infer<typeof step7Schema>

export type StoredCase = CaseData & {
  id: string
  user_id: string
  created_at: string
}

export const STEP_TITLES = [
  "General & Patient",
  "Clinical Assessment",
  "Objective (B1–B6)",
  "Investigations & Plan",
  "Anesthesia Management",
  "Intra-Operative",
  "Post-Operative",
] as const

export const drugSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  mechanism_of_action: z.string().min(1, "Mechanism of action is required"),
  pharmacokinetics: z.string().min(1, "Pharmacokinetics is required"),
  pharmacodynamics: z.string().min(1, "Pharmacodynamics is required"),
  onset_of_action: z.string().min(1, "Onset of action is required"),
  duration_of_action: z.string().min(1, "Duration of action is required"),
  induction_dose: z.string().min(1, "Induction dose is required"),
  maintenance_dose: z.string().min(1, "Maintenance dose is required"),
  side_effects: z.string().min(1, "Side effects are required"),
  clinical_considerations: z.string().min(1, "Clinical considerations are required"),
  contraindications: z.string().optional().default(""),
  infusion_guidelines: z.string().optional().default(""),
  is_high_alert: z.boolean().default(false),
})

export type DrugData = z.infer<typeof drugSchema>

export type AnesthesiaDrug = DrugData & {
  id: string
  user_id: string | null
  created_at?: string
  updated_at?: string
}

