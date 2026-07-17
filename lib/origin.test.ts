import { describe, it, expect } from "vitest"
import { getRequestOrigin } from "./origin"

function makeRequest(headers: Record<string, string>): Request {
  return new Request("http://internal.local", { headers })
}

describe("getRequestOrigin", () => {
  it("prefers x-forwarded-proto and x-forwarded-host", () => {
    const req = makeRequest({
      "x-forwarded-proto": "https",
      "x-forwarded-host": "app.example.com",
    })
    expect(getRequestOrigin(req)).toBe("https://app.example.com")
  })

  it("falls back to the host header when x-forwarded-host is absent", () => {
    const req = makeRequest({
      "x-forwarded-proto": "https",
      host: "fallback.example.com",
    })
    expect(getRequestOrigin(req)).toBe("https://fallback.example.com")
  })

  it("defaults proto to http and host to localhost:3000", () => {
    const req = makeRequest({})
    expect(getRequestOrigin(req)).toBe("http://localhost:3000")
  })

  it("uses only the first value of a comma-separated proto list", () => {
    const req = makeRequest({
      "x-forwarded-proto": "https, http",
      "x-forwarded-host": "app.example.com",
    })
    expect(getRequestOrigin(req)).toBe("https://app.example.com")
  })

  it("uses only the first value of a comma-separated host list and trims whitespace", () => {
    const req = makeRequest({
      "x-forwarded-proto": "https",
      "x-forwarded-host": " first.example.com , second.example.com ",
    })
    expect(getRequestOrigin(req)).toBe("https://first.example.com")
  })
})
