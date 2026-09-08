'use client'

import { useState } from 'react'
import { Music, RefreshCw, Unlock } from 'lucide-react'
import { useAuthActions } from '@convex-dev/auth/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Icons } from '@/components/icons'
import { SUBSCRIPTION_PRICE } from '@/lib/models'

const FEATURES = [
  { icon: Music, label: 'Luna, Terra, and Sol on every prompt' },
  { icon: RefreshCw, label: 'Usage resets every month' },
  { icon: Unlock, label: 'Cancel whenever you want' },
] as const

type SubscribeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  required?: boolean
}

export function SubscribeDialog({ open, onOpenChange, required }: SubscribeDialogProps) {
  const { signOut } = useAuthActions()
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startCheckout = async () => {
    setIsStarting(true)
    setError(null)
    try {
      const response = await fetch('/api/billing/checkout', { method: 'POST' })
      const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string }
      if (!response.ok || !data.url) throw new Error(data.error || 'Could not start checkout')
      window.location.assign(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout')
      setIsStarting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (required && !next) return
        onOpenChange(next)
      }}
    >
      <DialogContent
        showCloseButton={!required}
        onPointerDownOutside={required ? (event) => event.preventDefault() : undefined}
        onEscapeKeyDown={required ? (event) => event.preventDefault() : undefined}
        className="flex max-w-sm flex-col gap-6 rounded-3xl p-8 sm:rounded-3xl"
      >
        <DialogHeader className="space-y-3 text-center sm:text-center">
          <DialogTitle className="font-outfit text-3xl font-semibold leading-[1.1] tracking-[-0.04em]">
            Sign up for Stroop Pro
          </DialogTitle>
          <DialogDescription className="text-pretty leading-relaxed">
            Keep generating with Luna, Terra, or Sol. ${SUBSCRIPTION_PRICE}/month, cancel anytime.
          </DialogDescription>
        </DialogHeader>
        <ul className="mx-auto w-fit space-y-4">
          {FEATURES.map((feature) => (
            <li key={feature.label} className="flex items-center gap-3 text-sm text-muted-foreground">
              <feature.icon className="size-5 shrink-0" strokeWidth={1.5} />
              {feature.label}
            </li>
          ))}
        </ul>
        {error && <p className="text-center text-sm text-destructive">{error}</p>}
        <div className="flex flex-col items-center gap-3">
          <Button className="h-12 w-full rounded-full" onClick={startCheckout} disabled={isStarting}>
            {isStarting && <Icons.spinner className="animate-spin" />}
            Subscribe to Stroop Pro
          </Button>
          {required && (
            <Button variant="link" className="h-auto p-0 text-muted-foreground" onClick={() => void signOut()}>
              Sign out
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            <a href="/legal/terms" className="underline-offset-4 hover:underline">Terms</a>
            {' · '}
            <a href="/legal/refunds" className="underline-offset-4 hover:underline">Refunds</a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
