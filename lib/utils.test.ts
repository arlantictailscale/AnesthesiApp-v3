import { describe, it, expect } from "vitest"
import { cn } from "./utils"

describe("cn", () => {
  it("joins multiple class strings", () => {
    expect(cn("a", "b", "c")).toBe("a b c")
  })

  it("ignores falsy values", () => {
    expect(cn("a", false, null, undefined, "", "b")).toBe("a b")
  })

  it("supports conditional object syntax from clsx", () => {
    expect(cn("base", { active: true, disabled: false })).toBe("base active")
  })

  it("flattens arrays of classes", () => {
    expect(cn(["a", "b"], "c")).toBe("a b c")
  })

  it("merges conflicting tailwind classes keeping the last one", () => {
    expect(cn("px-2", "px-4")).toBe("px-4")
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500")
  })

  it("keeps non-conflicting tailwind classes", () => {
    expect(cn("px-2", "py-4")).toBe("px-2 py-4")
  })

  it("returns an empty string when given no arguments", () => {
    expect(cn()).toBe("")
  })
})
