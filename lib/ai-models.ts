export const AI_MODELS = [
  // Free models (sorted by price: all $0)
  {
    id: "google/gemini-2.5-flash",
    label: "Gemini 2.5 Flash (Direct)",
    tier: "free",
    price: 0,
    priceLabel: "Free",
    description: "Google Gemini 2.5 Flash, fast and highly accurate clinical data extraction"
  },
  {
    id: "nvidia/nemotron-3-ultra-550b-a55b:free",
    label: "Nemotron-3 Ultra 550B (free)",
    tier: "free",
    price: 0,
    priceLabel: "Free",
    description: "NVIDIA Nemotron-3 Ultra 550B, high capacity reasoning"
  },
  {
    id: "openrouter/owl-alpha",
    label: "Owl Alpha",
    tier: "free",
    price: 0,
    priceLabel: "Free",
    description: "OpenRouter Owl Alpha — default model for AnesthesiApp"
  },
  {
    id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    label: "Nemotron-3 Nano Omni (free)",
    tier: "free",
    price: 0,
    priceLabel: "Free",
    description: "NVIDIA Nemotron-3 Nano Omni 30B reasoning model"
  },
  {
    id: "poolside/laguna-m.1:free",
    label: "Laguna M.1 (free)",
    tier: "free",
    price: 0,
    priceLabel: "Free",
    description: "Poolside Laguna M.1 code and reasoning model"
  },
  {
    id: "moonshotai/kimi-k2.6:free",
    label: "Kimi K2.6 (free)",
    tier: "free",
    price: 0,
    priceLabel: "Free",
    description: "Moonshot AI Kimi K2.6 high-context reasoning model"
  },
  {
    id: "google/gemma-4-31b-it:free",
    label: "Gemma 4 31B (free)",
    tier: "free",
    price: 0,
    priceLabel: "Free",
    description: "Google Gemma 4 31B Instruct model"
  },
  {
    id: "nvidia/nemotron-3-super-120b-a12b:free",
    label: "Nemotron-3 Super 120B (free)",
    tier: "free",
    price: 0,
    priceLabel: "Free",
    description: "NVIDIA Nemotron-3 Super 120B high-capacity assistant"
  },
  {
    id: "openrouter/free",
    label: "OpenRouter Auto (free)",
    tier: "free",
    price: 0,
    priceLabel: "Free",
    description: "OpenRouter auto-routes to a free model"
  },

  // Paid models (sorted by price)
  {
    id: "openai/gpt-oss-120b",
    label: "GPT OSS 120B",
    tier: "paid",
    price: 0.0001,
    priceLabel: "< $0.01 / 1M tokens",
    description: "OpenAI GPT OSS 120B parameter model"
  },
  {
    id: "inclusionai/ling-2.6-flash",
    label: "Ling 2.6 Flash",
    tier: "paid",
    price: 0.01,
    priceLabel: "$0.01 / 1M tokens",
    description: "inclusionAI Ling 2.6 Flash instant model"
  },
  {
    id: "openai/gpt-5-nano",
    label: "GPT-5 Nano",
    tier: "paid",
    price: 0.015,
    priceLabel: "$0.015 / 1M tokens",
    description: "OpenAI GPT-5 Nano lightweight model"
  },
  {
    id: "liquid/lfm-2-24b-a2b",
    label: "Liquid LFM 2 24B",
    tier: "paid",
    price: 0.03,
    priceLabel: "$0.03 / 1M tokens",
    description: "Liquid LFM-2-24B-A2B coding & reasoning model"
  },
  {
    id: "openai/gpt-oss-20b",
    label: "GPT OSS 20B",
    tier: "paid",
    price: 0.031,
    priceLabel: "$0.03 / 1M tokens",
    description: "OpenAI GPT OSS 20B model"
  },

  {
    id: "arcee-ai/trinity-mini",
    label: "Trinity Mini",
    tier: "paid",
    price: 0.045,
    priceLabel: "$0.045 / 1M tokens",
    description: "Arcee AI Trinity Mini reasoning model"
  },
  {
    id: "ibm-granite/granite-4.1-8b",
    label: "Granite 4.1 8B",
    tier: "paid",
    price: 0.05,
    priceLabel: "$0.05 / 1M tokens",
    description: "IBM Granite 4.1 8B parameter instruct model"
  },
  {
    id: "google/gemma-4-26b-a4b-it",
    label: "Gemma 4 26B",
    tier: "paid",
    price: 0.06,
    priceLabel: "$0.06 / 1M tokens",
    description: "Google Gemma 4 26B instruct model"
  },
  {
    id: "z-ai/glm-4.7-flash",
    label: "GLM 4.7 Flash",
    tier: "paid",
    price: 0.061,
    priceLabel: "$0.06 / 1M tokens",
    description: "Zhipu AI GLM 4.7 Flash model"
  },
  {
    id: "tencent/hy3-preview",
    label: "HY3 Preview",
    tier: "paid",
    price: 0.063,
    priceLabel: "$0.063 / 1M tokens",
    description: "Tencent Hunyuan 3 Preview MoE model"
  },
  {
    id: "qwen/qwen3.5-flash-02-23",
    label: "Qwen 3.5 Flash",
    tier: "paid",
    price: 0.065,
    priceLabel: "$0.065 / 1M tokens",
    description: "Alibaba Qwen 3.5 Flash model"
  },
  {
    id: "mistralai/mistral-small-3.2-24b-instruct",
    label: "Mistral Small 3.2",
    tier: "paid",
    price: 0.075,
    priceLabel: "$0.075 / 1M tokens",
    description: "Mistral AI Small 3.2 24B instruct model"
  },
  {
    id: "openai/gpt-oss-safeguard-20b",
    label: "GPT OSS Safeguard 20B",
    tier: "paid",
    price: 0.076,
    priceLabel: "$0.075 / 1M tokens",
    description: "OpenAI GPT OSS Safeguard 20B model"
  },
  {
    id: "bytedance-seed/seed-1.6-flash",
    label: "Seed 1.6 Flash",
    tier: "paid",
    price: 0.077,
    priceLabel: "$0.075 / 1M tokens",
    description: "ByteDance Seed 1.6 Flash model"
  },
  {
    id: "inclusionai/ling-2.6-1t",
    label: "Ling 2.6 1T",
    tier: "paid",
    price: 0.08,
    priceLabel: "$0.08 / 1M tokens",
    description: "inclusionAI Ling 2.6 1T model"
  },
  {
    id: "inclusionai/ring-2.6-1t",
    label: "Ring 2.6 1T",
    tier: "paid",
    price: 0.081,
    priceLabel: "$0.08 / 1M tokens",
    description: "inclusionAI Ring 2.6 1T model"
  },
  {
    id: "nvidia/nemotron-3-super-120b-a12b",
    label: "Nemotron-3 Super 120B",
    tier: "paid",
    price: 0.082,
    priceLabel: "$0.08 / 1M tokens",
    description: "NVIDIA Nemotron-3 Super 120B parameter assistant"
  },
  {
    id: "deepseek/deepseek-v4-flash",
    label: "DeepSeek V4 Flash",
    tier: "paid",
    price: 0.098,
    priceLabel: "$0.098 / 1M tokens",
    description: "DeepSeek V4 Flash coding & reasoning model"
  },

] as const

export type AiModelId = (typeof AI_MODELS)[number]["id"]

export const DEFAULT_AI_MODEL: AiModelId = "google/gemini-2.5-flash"
