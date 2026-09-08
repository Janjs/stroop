import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'

function toMs(value: unknown) {
  if (!value) return undefined
  if (typeof value === 'number') return value
  const time = new Date(value as string).getTime()
  return Number.isFinite(time) ? time : undefined
}

export async function POST(request: Request) {
  const secret = process.env.POLAR_WEBHOOK_SECRET
  if (!secret) return new Response('Webhook is not configured', { status: 500 })

  const body = await request.text()
  const headers: Record<string, string> = {}
  request.headers.forEach((value, key) => {
    headers[key] = value
  })

  let event
  try {
    event = validateEvent(body, headers, secret)
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      return new Response('Invalid signature', { status: 403 })
    }
    throw error
  }

  if (!event.type.startsWith('subscription.')) {
    return new Response(null, { status: 202 })
  }

  const data = event.data as {
    id?: string
    status?: string
    customerId?: string
    currentPeriodStart?: unknown
    currentPeriodEnd?: unknown
    metadata?: { userId?: string }
    customer?: { id?: string; externalId?: string }
  }

  const userId = data.metadata?.userId ?? data.customer?.externalId
  if (!userId) return new Response(null, { status: 202 })

  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
  await convex.mutation(api.billing.applySubscription, {
    secret,
    userId,
    status: data.status ?? 'unknown',
    polarCustomerId: data.customerId ?? data.customer?.id,
    polarSubscriptionId: data.id,
    periodStart: toMs(data.currentPeriodStart),
    periodEnd: toMs(data.currentPeriodEnd),
  })

  return new Response(null, { status: 202 })
}
