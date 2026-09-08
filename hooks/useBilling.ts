'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useAnonymousSession } from '@/hooks/useAnonymousSession'

export function useBilling() {
  const anonymousSessionId = useAnonymousSession()
  return useQuery(api.credits.getUsage, { anonymousSessionId: anonymousSessionId ?? undefined })
}

export type BillingUsage = {
  isAuthenticated: boolean
  isSubscribed: boolean
  freeRemaining: number
  freeLimit: number
  usedCents: number
  includedCents: number
}

export function usagePercentUsed(usage: BillingUsage) {
  if (!usage.isSubscribed) {
    const total = usage.freeLimit || 3
    return total === 0 ? 0 : ((total - usage.freeRemaining) / total) * 100
  }
  if (usage.includedCents <= 0 || usage.usedCents <= 0) return 0
  return Math.min(100, Math.max(1, Math.round((usage.usedCents / usage.includedCents) * 100)))
}
