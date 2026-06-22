import { type AiModelId } from "./ai-models"

interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

interface CallAiOptions {
  model: string
  messages: Message[]
  temperature?: number
  jsonMode?: boolean
  origin?: string
  timeoutMs?: number
}

export async function callAiModel({
  model,
  messages,
  temperature = 0.7,
  jsonMode = false,
  origin = "https://anesthesiapp.local",
  timeoutMs = 45000,
}: CallAiOptions): Promise<{ content: string }> {
  // Check if it's a direct Google Gemini model
  if (model.startsWith("google/gemini-")) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured")
    }

    // Extract the exact model name, e.g. "gemini-2.5-flash"
    const geminiModel = model.replace("google/", "")

    // Map roles to Gemini format: 'systemInstruction' for system prompt, others in 'contents'
    const systemMessage = messages.find((m) => m.role === "system")
    const chatMessages = messages.filter((m) => m.role !== "system")

    const contents = chatMessages.map((m) => {
      // Gemini roles must be 'user' or 'model'
      const role = m.role === "assistant" ? "model" : "user"
      return {
        role,
        parts: [{ text: m.content }],
      }
    })

    const body: any = {
      contents,
      generationConfig: {
        temperature,
      },
    }

    if (systemMessage) {
      body.systemInstruction = {
        parts: [{ text: systemMessage.content }],
      }
    }

    if (jsonMode) {
      body.generationConfig.responseMimeType = "application/json"
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    let res: Response
    try {
      res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
    } catch (fetchErr: any) {
      if (fetchErr.name === "AbortError") {
        throw new Error(`Gemini API request timed out after ${timeoutMs}ms`)
      }
      throw fetchErr
    } finally {
      clearTimeout(timeoutId)
    }

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Gemini API error (${res.status}): ${errText}`)
    }

    const data = await res.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
    return { content }
  }

  // Otherwise, use OpenRouter API
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured")
  }

  const payload: any = {
    model,
    temperature,
    messages,
  }

  if (jsonMode) {
    payload.response_format = { type: "json_object" }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  let res: Response
  try {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": origin,
        "X-Title": "AnesthesiApp",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
  } catch (fetchErr: any) {
    if (fetchErr.name === "AbortError") {
      throw new Error(`OpenRouter API request timed out after ${timeoutMs}ms`)
    }
    throw fetchErr
  } finally {
    clearTimeout(timeoutId)
  }

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`OpenRouter API error (${res.status}): ${errText}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content ?? ""
  return { content }
}

function findClosingSymbol(jsonStr: string, startIndex: number, startChar: string, endChar: string): number {
  let depth = 0
  let inString = false
  let escaped = false

  for (let i = startIndex; i < jsonStr.length; i++) {
    const char = jsonStr[i]

    if (escaped) {
      escaped = false
      continue
    }

    if (char === "\\") {
      escaped = true
      continue
    }

    if (char === '"') {
      inString = !inString
      continue
    }

    if (!inString) {
      if (char === startChar) {
        depth++
      } else if (char === endChar) {
        depth--
        if (depth === 0) {
          return i
        }
      }
    }
  }

  return -1
}

function stripComments(raw: string): string {
  let result = ""
  let inString = false
  let escaped = false

  for (let i = 0; i < raw.length; i++) {
    const char = raw[i]

    if (escaped) {
      result += char
      escaped = false
      continue
    }

    if (char === "\\") {
      result += char
      escaped = true
      continue
    }

    if (char === '"') {
      inString = !inString
      result += char
      continue
    }

    if (!inString) {
      if (char === "/" && raw[i + 1] === "/") {
        while (i < raw.length && raw[i] !== "\n" && raw[i] !== "\r") {
          i++
        }
        if (i < raw.length) {
          result += raw[i]
        }
        continue
      }
      if (char === "/" && raw[i + 1] === "*") {
        i += 2
        while (i < raw.length && !(raw[i] === "*" && raw[i + 1] === "/")) {
          i++
        }
        i++
        continue
      }
    }

    result += char
  }
  return result
}

function sanitizeJsonString(raw: string): string {
  let result = ""
  let inString = false
  let escaped = false

  for (let i = 0; i < raw.length; i++) {
    const char = raw[i]

    if (escaped) {
      result += char
      escaped = false
      continue
    }

    if (char === "\\") {
      result += char
      escaped = true
      continue
    }

    if (char === '"') {
      inString = !inString
      result += char
      continue
    }

    if (inString) {
      if (char === "\n") {
        result += "\\n"
      } else if (char === "\r") {
        result += "\\r"
      } else if (char === "\t") {
        result += "\\t"
      } else {
        result += char
      }
    } else {
      result += char
    }
  }
  return result
}

function removeTrailingCommas(raw: string): string {
  let result = ""
  let inString = false
  let escaped = false

  for (let i = 0; i < raw.length; i++) {
    const char = raw[i]

    if (escaped) {
      result += char
      escaped = false
      continue
    }

    if (char === "\\") {
      result += char
      escaped = true
      continue
    }

    if (char === '"') {
      inString = !inString
      result += char
      continue
    }

    if (!inString && char === ",") {
      let nextNonWhitespace = ""
      let nextIdx = i + 1
      while (nextIdx < raw.length) {
        const nextChar = raw[nextIdx]
        if (nextChar !== " " && nextChar !== "\n" && nextChar !== "\r" && nextChar !== "\t") {
          nextNonWhitespace = nextChar
          break
        }
        nextIdx++
      }
      if (nextNonWhitespace === "}" || nextNonWhitespace === "]") {
        continue
      }
    }

    result += char
  }
  return result
}

export function extractJson(text: string): any {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  const body = fenced ? fenced[1] : trimmed

  const firstBrace = body.indexOf("{")
  const firstBracket = body.indexOf("[")

  let startChar = ""
  let endChar = ""
  let startIndex = -1

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startChar = "{"
    endChar = "}"
    startIndex = firstBrace
  } else if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
    startChar = "["
    endChar = "]"
    startIndex = firstBracket
  } else {
    throw new Error("Model did not return any JSON object or array")
  }

  const lastIndex = findClosingSymbol(body, startIndex, startChar, endChar)
  if (lastIndex === -1) {
    throw new Error(`Model did not return matching closing symbol for ${startChar}`)
  }

  const rawJson = body.slice(startIndex, lastIndex + 1)
  const strippedComments = stripComments(rawJson)
  const escapedNewlines = sanitizeJsonString(strippedComments)
  const cleanJson = removeTrailingCommas(escapedNewlines)

  return JSON.parse(cleanJson)
}

