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
}

export async function callAiModel({
  model,
  messages,
  temperature = 0.7,
  jsonMode = false,
  origin = "https://anesthesiapp.local",
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

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

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

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": origin,
      "X-Title": "AnesthesiApp",
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`OpenRouter API error (${res.status}): ${errText}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content ?? ""
  return { content }
}
