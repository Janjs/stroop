export const LUNA_MODEL_ID = 'gpt-5.6-luna'

export const MODELS = [
  {
    id: LUNA_MODEL_ID,
    name: 'Luna',
    provider: 'openai',
    openrouter: 'openai/gpt-5.6-luna',
    openai: 'gpt-5.6-luna',
    inputPerM: 0.2,
    outputPerM: 1.2,
    paid: false,
  },
  {
    id: 'gpt-5.6-terra',
    name: 'Terra',
    provider: 'openai',
    openrouter: 'openai/gpt-5.6-terra',
    openai: 'gpt-5.6-terra',
    inputPerM: 2,
    outputPerM: 12,
    paid: true,
  },
  {
    id: 'gpt-5.6-sol',
    name: 'Sol',
    provider: 'openai',
    openrouter: 'openai/gpt-5.6-sol',
    openai: 'gpt-5.6-sol',
    inputPerM: 4,
    outputPerM: 20,
    paid: true,
  },
  {
    id: 'claude-haiku-4.5',
    name: 'Haiku',
    provider: 'anthropic',
    openrouter: 'anthropic/claude-haiku-4.5',
    inputPerM: 1,
    outputPerM: 5,
    paid: true,
  },
  {
    id: 'claude-sonnet-5',
    name: 'Sonnet',
    provider: 'anthropic',
    openrouter: 'anthropic/claude-sonnet-5',
    inputPerM: 2,
    outputPerM: 10,
    paid: true,
  },
  {
    id: 'claude-opus-5',
    name: 'Opus',
    provider: 'anthropic',
    openrouter: 'anthropic/claude-opus-5',
    inputPerM: 5,
    outputPerM: 25,
    paid: true,
  },
  {
    id: 'grok-4.6',
    name: 'Grok',
    provider: 'xai',
    openrouter: 'x-ai/grok-4.6',
    inputPerM: 2,
    outputPerM: 6,
    paid: true,
  },
  {
    id: 'kimi-k3',
    name: 'Kimi',
    provider: 'moonshotai',
    openrouter: 'moonshotai/kimi-k3',
    inputPerM: 3,
    outputPerM: 15,
    paid: true,
  },
] as const

export type ModelId = (typeof MODELS)[number]['id']

export const DEFAULT_OPENAI_MODEL = LUNA_MODEL_ID
export const INCLUDED_CENTS = 400
export const SUBSCRIPTION_PRICE = 5

export function getModel(id: string) {
  return MODELS.find((model) => model.id === id) ?? MODELS[0]
}

export function knownModelId(id: string | null | undefined) {
  if (!id) return null
  return MODELS.some((model) => model.id === id) ? id : null
}

export function isPaidModel(id: string) {
  return getModel(id).paid
}

export function estimateUsageCents(modelId: string, inputTokens: number, outputTokens: number) {
  const model = getModel(modelId)
  const dollars = (inputTokens * model.inputPerM + outputTokens * model.outputPerM) / 1e6
  return Math.max(1, Math.round(dollars * 100))
}
