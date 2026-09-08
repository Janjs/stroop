import { Polar } from '@polar-sh/sdk'

export function polarClient() {
  const accessToken = process.env.POLAR_ORGANIZATION_TOKEN ?? process.env.POLAR_ACCESS_TOKEN
  if (!accessToken) throw new Error('Billing is not configured')
  return new Polar({
    accessToken,
    server: process.env.POLAR_SERVER === 'sandbox' ? 'sandbox' : 'production',
  })
}

export function polarFailure(error: unknown) {
  const statusCode =
    error && typeof error === 'object' && 'statusCode' in error
      ? Number((error as { statusCode: unknown }).statusCode)
      : undefined
  if (statusCode === 401) {
    return Response.json(
      { error: 'Polar access token is invalid or expired. Create a new organization token in Polar and restart the app.' },
      { status: 502 },
    )
  }
  const message = error instanceof Error ? error.message : 'Billing request failed'
  return Response.json({ error: message }, { status: 502 })
}
