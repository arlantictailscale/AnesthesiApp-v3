import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { callAiModel } from "./ai"

function mockFetchOnce(response: {
  ok: boolean
  status?: number
  json?: () => Promise<unknown>
  text?: () => Promise<string>
}) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status ?? 200,
    json: response.json ?? (async () => ({})),
    text: response.text ?? (async () => ""),
  })
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

describe("callAiModel", () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    delete process.env.GEMINI_API_KEY
    delete process.env.OPENROUTER_API_KEY
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    process.env = { ...originalEnv }
  })

  describe("Gemini branch", () => {
    it("throws when GEMINI_API_KEY is missing", async () => {
      await expect(
        callAiModel({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: "hi" }],
        }),
      ).rejects.toThrow("GEMINI_API_KEY is not configured")
    })

    it("calls the gemini endpoint and maps roles/system instruction", async () => {
      process.env.GEMINI_API_KEY = "gkey"
      const fetchMock = mockFetchOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: "hello world" }] } }],
        }),
      })

      const result = await callAiModel({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "be concise" },
          { role: "user", content: "hi" },
          { role: "assistant", content: "prev" },
        ],
        jsonMode: true,
        temperature: 0.2,
      })

      expect(result.content).toBe("hello world")
      expect(fetchMock).toHaveBeenCalledTimes(1)
      const [url, init] = fetchMock.mock.calls[0]
      expect(url).toContain(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      )
      expect(url).toContain("key=gkey")
      const body = JSON.parse((init as RequestInit).body as string)
      expect(body.systemInstruction.parts[0].text).toBe("be concise")
      expect(body.contents).toHaveLength(2)
      expect(body.contents[1].role).toBe("model")
      expect(body.generationConfig.temperature).toBe(0.2)
      expect(body.generationConfig.responseMimeType).toBe("application/json")
    })

    it("returns an empty string when gemini returns no candidates", async () => {
      process.env.GEMINI_API_KEY = "gkey"
      mockFetchOnce({ ok: true, json: async () => ({}) })
      const result = await callAiModel({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: "hi" }],
      })
      expect(result.content).toBe("")
    })

    it("throws a descriptive error on a non-ok gemini response", async () => {
      process.env.GEMINI_API_KEY = "gkey"
      mockFetchOnce({
        ok: false,
        status: 429,
        text: async () => "rate limited",
      })
      await expect(
        callAiModel({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: "hi" }],
        }),
      ).rejects.toThrow("Gemini API error (429): rate limited")
    })
  })

  describe("OpenRouter branch", () => {
    it("throws when OPENROUTER_API_KEY is missing", async () => {
      await expect(
        callAiModel({
          model: "openrouter/free",
          messages: [{ role: "user", content: "hi" }],
        }),
      ).rejects.toThrow("OPENROUTER_API_KEY is not configured")
    })

    it("calls openrouter with auth headers and returns the message content", async () => {
      process.env.OPENROUTER_API_KEY = "orkey"
      const fetchMock = mockFetchOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "router reply" } }],
        }),
      })

      const result = await callAiModel({
        model: "openrouter/free",
        messages: [{ role: "user", content: "hi" }],
        jsonMode: true,
        origin: "https://custom.origin",
      })

      expect(result.content).toBe("router reply")
      const [url, init] = fetchMock.mock.calls[0]
      expect(url).toBe("https://openrouter.ai/api/v1/chat/completions")
      const headers = (init as RequestInit).headers as Record<string, string>
      expect(headers.Authorization).toBe("Bearer orkey")
      expect(headers["HTTP-Referer"]).toBe("https://custom.origin")
      const body = JSON.parse((init as RequestInit).body as string)
      expect(body.model).toBe("openrouter/free")
      expect(body.response_format).toEqual({ type: "json_object" })
    })

    it("throws a descriptive error on a non-ok openrouter response", async () => {
      process.env.OPENROUTER_API_KEY = "orkey"
      mockFetchOnce({ ok: false, status: 500, text: async () => "boom" })
      await expect(
        callAiModel({
          model: "openrouter/free",
          messages: [{ role: "user", content: "hi" }],
        }),
      ).rejects.toThrow("OpenRouter API error (500): boom")
    })
  })
})
