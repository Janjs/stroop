'use client'

import { useAuthActions } from '@convex-dev/auth/react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'

type UseSignInOptions = {
  redirectTo?: string
}

export function useSignIn(options?: UseSignInOptions) {
  const { signIn } = useAuthActions()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isSigningIn, setIsSigningIn] = useState(false)

  const currentUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')

  const handleSignIn = useCallback(() => {
    setIsSigningIn(true)
    void signIn('google', { redirectTo: options?.redirectTo ?? currentUrl })
  }, [signIn, options?.redirectTo, currentUrl])

  return { handleSignIn, isSigningIn }
}
