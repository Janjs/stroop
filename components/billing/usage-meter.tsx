'use client'

import { badgeVariants } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { usagePercentUsed, type BillingUsage } from '@/hooks/useBilling'
import { cn } from '@/lib/utils'

export function FreeGens({ usage, onClick }: { usage: BillingUsage; onClick?: () => void }) {
  if (usage.isAuthenticated) return null
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(badgeVariants({ variant: 'secondary' }), 'border-0 text-xs')}
    >
      {usage.freeRemaining}/{usage.freeLimit} free generations
    </button>
  )
}

export function UsageMeter({ usage, className }: { usage: BillingUsage; className?: string }) {
  const used = Math.round(usagePercentUsed(usage))

  return (
    <div className={cn('w-full space-y-1.5 px-2 py-1.5', className)}>
      <div className="flex items-center justify-between text-sm">
        <span>Usage</span>
        <span className="text-xs text-muted-foreground">{used}%</span>
      </div>
      <Progress value={used} className="h-1.5" />
    </div>
  )
}
