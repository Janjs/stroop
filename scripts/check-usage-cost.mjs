import assert from 'node:assert/strict'

const MODELS = {
  'gpt-5.6-luna': { inputPerM: 0.2, outputPerM: 1.2 },
  'gpt-5.6-terra': { inputPerM: 2, outputPerM: 12 },
  'gpt-5.6-sol': { inputPerM: 4, outputPerM: 20 },
}

function estimateUsageCents(modelId, inputTokens, outputTokens) {
  const model = MODELS[modelId]
  const dollars = (inputTokens * model.inputPerM + outputTokens * model.outputPerM) / 1e6
  return Math.max(1, Math.round(dollars * 100))
}

assert.equal(estimateUsageCents('gpt-5.6-luna', 1_000_000, 0), 20)
assert.equal(estimateUsageCents('gpt-5.6-terra', 1_000_000, 0), 200)
assert.equal(estimateUsageCents('gpt-5.6-sol', 0, 1_000_000), 2000)
assert.equal(estimateUsageCents('gpt-5.6-luna', 1, 0), 1)

function usagePercentUsed(usedCents, includedCents) {
  if (includedCents <= 0 || usedCents <= 0) return 0
  return Math.min(100, Math.max(1, Math.round((usedCents / includedCents) * 100)))
}

assert.equal(usagePercentUsed(0, 400), 0)
assert.equal(usagePercentUsed(1, 400), 1)
assert.equal(usagePercentUsed(200, 400), 50)
assert.equal(usagePercentUsed(400, 400), 100)
console.log('usage cost checks passed')
