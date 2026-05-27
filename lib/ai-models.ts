export const AI_MODELS = [
  {
    id: "openrouter/owl-alpha",
    label: "Owl Alpha",
    description: "OpenRouter Owl Alpha — default model for AnesthesiApp",
  },
  {
    id: "inclusionai/ling-2.6-1t:free",
    label: "Ling 2.6 1T (free)",
    description: "InclusionAI Ling 2.6, 1T parameters",
  },
  {
    id: "inclusionai/ling-2.6-flash:free",
    label: "Ling 2.6 Flash (free)",
    description: "InclusionAI Ling 2.6 Flash, faster / smaller variant",
  },
  {
    id: "tencent/hy3-preview:free",
    label: "Tencent HY3 Preview (free)",
    description: "Tencent HunYuan 3 preview, free tier",
  },
  {
    id: "baidu/qianfan-ocr-fast:free",
    label: "Qianfan OCR Fast (free)",
    description: "Baidu Qianfan OCR Fast — best for scanned / OCR-style notes",
  },
  {
    id: "openrouter/free",
    label: "OpenRouter Auto (free)",
    description: "OpenRouter auto-routes to a free model",
  },
] as const

export type AiModelId = (typeof AI_MODELS)[number]["id"]

export const DEFAULT_AI_MODEL: AiModelId = "openrouter/owl-alpha"
