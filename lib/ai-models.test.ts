import { describe, it, expect } from "vitest"
import { AI_MODELS, DEFAULT_AI_MODEL } from "./ai-models"

describe("AI_MODELS", () => {
  it("contains at least one model", () => {
    expect(AI_MODELS.length).toBeGreaterThan(0)
  })

  it("has unique model ids", () => {
    const ids = AI_MODELS.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("only uses the 'free' or 'paid' tier", () => {
    for (const model of AI_MODELS) {
      expect(["free", "paid"]).toContain(model.tier)
    }
  })

  it("marks every free model with price 0 and every paid model with price > 0", () => {
    for (const model of AI_MODELS) {
      if (model.tier === "free") {
        expect(model.price).toBe(0)
      } else {
        expect(model.price).toBeGreaterThan(0)
      }
    }
  })

  it("gives every model the required non-empty descriptive fields", () => {
    for (const model of AI_MODELS) {
      expect(model.id.length).toBeGreaterThan(0)
      expect(model.label.length).toBeGreaterThan(0)
      expect(model.priceLabel.length).toBeGreaterThan(0)
      expect(model.description.length).toBeGreaterThan(0)
      expect(model.tps).toBeGreaterThan(0)
    }
  })
})

describe("DEFAULT_AI_MODEL", () => {
  it("references a model that exists in AI_MODELS", () => {
    expect(AI_MODELS.some((m) => m.id === DEFAULT_AI_MODEL)).toBe(true)
  })
})
