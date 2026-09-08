'use client'

import { usePathname } from 'next/navigation'
import { useConvexAuth } from 'convex/react'
import { useBilling } from '@/hooks/useBilling'
import { SubscribeDialog } from '@/components/billing/subscribe-dialog'

export function BillingGate() {
  const pathname = usePathname()
  const { isAuthenticated } = useConvexAuth()
  const usage = useBilling()
  const onLegal = pathname.startsWith('/legal')

  return (
    <SubscribeDialog
      required
      open={Boolean(!onLegal && isAuthenticated && usage && !usage.isSubscribed)}
      onOpenChange={() => {}}
    />
  )
}
