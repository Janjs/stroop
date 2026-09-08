import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'
import { polarClient, polarFailure } from '@/lib/polar'

export async function POST(request: Request) {
  const token = await convexAuthNextjsToken()
  if (!token) return Response.json({ error: 'Sign in first' }, { status: 401 })

  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
  convex.setAuth(token)
  const user = await convex.query(api.user.getCurrentUser)
  if (!user?.id) return Response.json({ error: 'Sign in first' }, { status: 401 })

  const origin = new URL(request.url).origin
  try {
    const session = await polarClient().customerSessions.create({
      externalCustomerId: user.id,
      returnUrl: origin,
    })
    return Response.json({ url: session.customerPortalUrl })
  } catch (error) {
    return polarFailure(error)
  }
}
