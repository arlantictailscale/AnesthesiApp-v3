import { describe, it, expect } from "vitest"
import {
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step7Schema,
  caseSchema,
  drugSchema,
  guidelineSchema,
  STEP_TITLES,
} from "./schema"

const validStep1 = {
  procedure_date: "2024-01-01",
  patient_name: "John Doe",
  sex: "Male",
  age: 45,
  medical_record_number: "MRN-123",
  room: "OR-1",
  weight_kg: 70,
  height_cm: 175,
}

describe("step1Schema", () => {
  it("accepts a valid payload", () => {
    const result = step1Schema.safeParse(validStep1)
    expect(result.success).toBe(true)
  })

  it("rejects an empty patient name", () => {
    const result = step1Schema.safeParse({ ...validStep1, patient_name: "" })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Name is required")
    }
  })

  it("rejects an invalid sex value", () => {
    const result = step1Schema.safeParse({ ...validStep1, sex: "Other" })
    expect(result.success).toBe(false)
  })

  it("coerces numeric strings to numbers for age and weight", () => {
    const result = step1Schema.safeParse({
      ...validStep1,
      age: "50",
      weight_kg: "80.5",
      height_cm: "180",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.age).toBe(50)
      expect(result.data.weight_kg).toBe(80.5)
    }
  })

  it("enforces the age bounds (0-130)", () => {
    expect(step1Schema.safeParse({ ...validStep1, age: -1 }).success).toBe(false)
    expect(step1Schema.safeParse({ ...validStep1, age: 131 }).success).toBe(false)
    expect(step1Schema.safeParse({ ...validStep1, age: 0 }).success).toBe(true)
    expect(step1Schema.safeParse({ ...validStep1, age: 130 }).success).toBe(true)
  })

  it("requires a positive weight", () => {
    expect(step1Schema.safeParse({ ...validStep1, weight_kg: 0 }).success).toBe(false)
  })
})

describe("step2Schema", () => {
  it("requires diagnosis and procedure_intervention", () => {
    expect(step2Schema.safeParse({}).success).toBe(false)
  })

  it("defaults optional text fields to empty strings", () => {
    const result = step2Schema.safeParse({
      diagnosis: "Appendicitis",
      procedure_intervention: "Appendectomy",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.allergy).toBe("")
      expect(result.data.medication).toBe("")
      expect(result.data.event).toBe("")
    }
  })
})

describe("step3Schema", () => {
  it("fills all B1-B6 fields with empty string defaults", () => {
    const result = step3Schema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.b1_breathing).toBe("")
      expect(result.data.others).toBe("")
    }
  })
})

describe("step4Schema", () => {
  it("defaults nested investigation objects", () => {
    const result = step4Schema.safeParse({
      inv_laboratory: {},
      inv_xray: {},
      inv_ecg: {},
      inv_ct: {},
      inv_mri: {},
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.inv_laboratory.enabled).toBe(false)
      expect(result.data.inv_laboratory.result).toBe("")
    }
  })
})

describe("step7Schema", () => {
  it("defaults is_shared to true", () => {
    const result = step7Schema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.is_shared).toBe(true)
    }
  })

  it("only allows the known post_op_room values", () => {
    expect(step7Schema.safeParse({ post_op_room: "ICU" }).success).toBe(true)
    expect(step7Schema.safeParse({ post_op_room: "Ward" }).success).toBe(false)
  })
})

describe("caseSchema", () => {
  it("validates a merged case with the required step1/step2 fields", () => {
    const result = caseSchema.safeParse({
      ...validStep1,
      diagnosis: "Appendicitis",
      procedure_intervention: "Appendectomy",
      inv_laboratory: {},
      inv_xray: {},
      inv_ecg: {},
      inv_ct: {},
      inv_mri: {},
    })
    expect(result.success).toBe(true)
  })

  it("fails when required step1 fields are missing", () => {
    const result = caseSchema.safeParse({
      diagnosis: "Appendicitis",
      procedure_intervention: "Appendectomy",
    })
    expect(result.success).toBe(false)
  })
})

describe("drugSchema", () => {
  const validDrug = {
    name: "Propofol",
    category: "Induction agent",
    mechanism_of_action: "GABA-A potentiation",
    pharmacokinetics: "Rapid redistribution",
    pharmacodynamics: "Hypnosis",
    onset_of_action: "30s",
    duration_of_action: "5-10 min",
    induction_dose: "1-2.5 mg/kg",
    maintenance_dose: "100-200 mcg/kg/min",
    side_effects: "Hypotension",
    clinical_considerations: "Pain on injection",
  }

  it("accepts a valid drug and applies defaults", () => {
    const result = drugSchema.safeParse(validDrug)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.contraindications).toBe("")
      expect(result.data.infusion_guidelines).toBe("")
      expect(result.data.is_high_alert).toBe(false)
    }
  })

  it("requires the mandatory clinical fields", () => {
    expect(drugSchema.safeParse({ ...validDrug, name: "" }).success).toBe(false)
    expect(
      drugSchema.safeParse({ ...validDrug, mechanism_of_action: "" }).success,
    ).toBe(false)
  })
})

describe("guidelineSchema", () => {
  const validGuideline = {
    title: "Difficult Airway",
    organization: "ASA",
    category: "Airway",
    summary: "Algorithm summary",
    full_content: "Full content here",
  }

  it("accepts a valid guideline and defaults the url arrays", () => {
    const result = guidelineSchema.safeParse(validGuideline)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.file_urls).toEqual([])
      expect(result.data.image_urls).toEqual([])
    }
  })

  it("validates file_urls entries as name/url objects", () => {
    const result = guidelineSchema.safeParse({
      ...validGuideline,
      file_urls: [{ name: "doc", url: "https://example.com/doc.pdf" }],
      image_urls: ["https://example.com/a.png"],
    })
    expect(result.success).toBe(true)
  })

  it("rejects missing required fields", () => {
    expect(guidelineSchema.safeParse({ ...validGuideline, title: "" }).success).toBe(
      false,
    )
  })
})

describe("STEP_TITLES", () => {
  it("has exactly seven step titles", () => {
    expect(STEP_TITLES).toHaveLength(7)
  })
})
