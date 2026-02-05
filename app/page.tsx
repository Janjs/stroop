'use client'

import { Suspense } from 'react'
import LandingInput from '@/components/landing/landing-input'
import { Icons } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { useConvexAuth } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { usePathname, useSearchParams } from 'next/navigation'

const Page = () => {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const { signIn } = useAuthActions()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleStartWithStroop = () => {
    const currentUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
    void signIn('google', { redirectTo: currentUrl })
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-60px)] w-full max-w-full">
      <div className="flex flex-col w-full max-w-full gap-4 items-center text-center px-4">
        {!isLoading && !isAuthenticated && (
          <Badge
            className="flex h-7 border border-foreground/20 items-center gap-2 bg-card/80 text-foreground shadow-sm backdrop-blur cursor-pointer hover:bg-card/90 transition-colors"
            onClick={handleStartWithStroop}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-accent" />
            <span className="flex items-center gap-1 leading-none">
              Start with
              <Icons.music className="h-3.5 w-3.5" />
            </span>
          </Badge>
        )}
        <h1 className="text-3xl md:text-5xl font-bold flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-outfit">
          <span>Create playable</span>
          <span>strudel code</span>
        </h1>
        <h3 className="text-sm md:text-xl text-muted-foreground">Generate Strudel code snippets for live-coding music</h3>
        <Suspense fallback={null}>
          <LandingInput />
        </Suspense>
      </div>
    </div>
  )
}

export default Page
