import { describe, it, expect } from "vitest"
import {
  builtInPackages,
  DEFAULT_CBT_PACKAGE,
} from "./default-data"

const VALID_OPTIONS = ["A", "B", "C", "D", "E"] as const

describe("DEFAULT_CBT_PACKAGE", () => {
  it("is included in builtInPackages", () => {
    expect(builtInPackages).toContain(DEFAULT_CBT_PACKAGE)
  })

  it("has a stable id, name and description", () => {
    expect(DEFAULT_CBT_PACKAGE.id).toBe("default-national-exam")
    expect(DEFAULT_CBT_PACKAGE.name.length).toBeGreaterThan(0)
    expect(DEFAULT_CBT_PACKAGE.description.length).toBeGreaterThan(0)
  })

  it("generates exactly 100 questions", () => {
    expect(DEFAULT_CBT_PACKAGE.questions).toHaveLength(100)
  })

  it("has unique sequential question ids q1..q100", () => {
    const ids = DEFAULT_CBT_PACKAGE.questions.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (let i = 0; i < 100; i++) {
      expect(ids).toContain(`q${i + 1}`)
    }
  })

  it("gives every question non-empty text, explanation and five options", () => {
    for (const q of DEFAULT_CBT_PACKAGE.questions) {
      expect(q.text.trim().length).toBeGreaterThan(0)
      expect(q.explanation.trim().length).toBeGreaterThan(0)
      const optionKeys = Object.keys(q.options).sort()
      expect(optionKeys).toEqual(["A", "B", "C", "D", "E"])
      for (const key of VALID_OPTIONS) {
        expect(q.options[key].trim().length).toBeGreaterThan(0)
      }
    }
  })

  it("points correctOption at one of the five valid options for every question", () => {
    for (const q of DEFAULT_CBT_PACKAGE.questions) {
      expect(VALID_OPTIONS).toContain(q.correctOption)
    }
  })

  it("assigns every question a non-empty category", () => {
    for (const q of DEFAULT_CBT_PACKAGE.questions) {
      expect(typeof q.category).toBe("string")
      expect(q.category.length).toBeGreaterThan(0)
    }
  })
})

describe("builtInPackages", () => {
  it("has unique package ids", () => {
    const ids = builtInPackages.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
