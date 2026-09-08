import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'
import { polarClient, polarFailure } from '@/lib/polar'

export async function POST(request: Request) {
  const token = await convexAuthNextjsToken()
  if (!token) return Response.json({ error: 'Sign in first' }, { status: 401 })

  const productId = process.env.POLAR_PRODUCT_ID
  if (!productId) return Response.json({ error: 'Billing is not configured' }, { status: 500 })

  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
  convex.setAuth(token)
  const user = await convex.query(api.user.getCurrentUser)
  if (!user?.id || !user.email) {
    return Response.json({ error: 'No email on this account' }, { status: 400 })
  }

  const origin = new URL(request.url).origin
  try {
    const checkout = await polarClient().checkouts.create({
      products: [productId],
      customerEmail: user.email,
      externalCustomerId: user.id,
      successUrl: `${origin}/generate?checkout=success`,
      metadata: { userId: user.id },
    })
    return Response.json({ url: checkout.url })
  } catch (error) {
    return polarFailure(error)
  }
}
