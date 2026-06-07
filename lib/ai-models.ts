export const AI_MODELS = [
  {
    id: "google/gemini-2.5-flash",
    label: "Gemini 2.5 Flash (Google API)",
    description: "Google Gemini 2.5 Flash via official Google AI API (free tier)",
  },
  {
    id: "google/gemini-1.5-flash",
    label: "Gemini 1.5 Flash (Google API)",
    description: "Google Gemini 1.5 Flash via official Google AI API (free tier)",
  },
  {
    id: "google/gemini-1.5-pro",
    label: "Gemini 1.5 Pro (Google API)",
    description: "Google Gemini 1.5 Pro via official Google AI API (free tier)",
  },
  {
    id: "nvidia/nemotron-3-ultra-550b-a55b:free",
    label: "Nemotron-3 Ultra 550B (free)",
    description: "NVIDIA Nemotron-3 Ultra 550B, high capacity reasoning",
  },
  {
    id: "openrouter/owl-alpha",
    label: "Owl Alpha",
    description: "OpenRouter Owl Alpha — default model for AnesthesiApp",
  },
  {
    id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    label: "Nemotron-3 Nano Omni (free)",
    description: "NVIDIA Nemotron-3 Nano Omni 30B reasoning model",
  },
  {
    id: "poolside/laguna-m.1:free",
    label: "Laguna M.1 (free)",
    description: "Poolside Laguna M.1 code and reasoning model",
  },
  {
    id: "moonshotai/kimi-k2.6:free",
    label: "Kimi K2.6 (free)",
    description: "Moonshot AI Kimi K2.6 high-context reasoning model",
  },
  {
    id: "google/gemma-4-31b-it:free",
    label: "Gemma 4 31B It (free)",
    description: "Google Gemma 4 31B Instruct model",
  },
  {
    id: "nvidia/nemotron-3-super-120b-a12b:free",
    label: "Nemotron-3 Super 120B (free)",
    description: "NVIDIA Nemotron-3 Super 120B high-capacity assistant",
  },
  {
    id: "openrouter/free",
    label: "OpenRouter Auto (free)",
    description: "OpenRouter auto-routes to a free model",
  },
] as const

export type AiModelId = (typeof AI_MODELS)[number]["id"]

export const DEFAULT_AI_MODEL: AiModelId = "openrouter/owl-alpha"
