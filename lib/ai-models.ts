export const AI_MODELS = [
  {
    id: "openrouter/elephant-alpha",
    label: "Elephant Alpha",
    description: "Default model for AnesthesiApp case population",
  },
  {
    id: "google/gemma-4-31b-it:free",
    label: "Gemma 4 31B (free)",
    description: "Google Gemma 4, 31B instruct, free tier",
  },
  {
    id: "google/gemma-4-26b-a4b-it:free",
    label: "Gemma 4 26B A4B (free)",
    description: "Google Gemma 4, 26B A4B instruct, free tier",
  },
] as const

export type AiModelId = (typeof AI_MODELS)[number]["id"]

export const DEFAULT_AI_MODEL: AiModelId = "openrouter/elephant-alpha"
