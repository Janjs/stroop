'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useConvexAuth } from 'convex/react'
import LandingInput from '@/components/landing/landing-input'
import ExamplesCarousel from '@/components/landing/examples-carousel'
import { Icons } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import Footer from './footer'

const Page = () => {
  const { isAuthenticated, isLoading } = useConvexAuth()

  return (
    <div className="flex min-h-[calc(100dvh-72px)] w-full max-w-full flex-col">
      <div className="flex w-full flex-1 items-center justify-center px-5 py-10 md:px-10 lg:px-16">
        <div className="flex w-full max-w-6xl flex-col gap-12 md:flex-row md:items-center md:gap-12 lg:gap-20">
          <div className="flex flex-col gap-5 md:w-[55%]">
            <Link
              href="https://chordwise.chat"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Badge
                variant="outline"
                className="flex h-8 w-fit cursor-pointer items-center gap-2 rounded-full border-white/40 bg-card/70 px-3 shadow-sm backdrop-blur-xl transition-[background-color,transform] hover:bg-card/90 active:scale-[0.98] dark:border-white/10"
              >
                <span className="leading-none">Try chordwise too!</span>
                <Icons.chordwiseMascot className="h-4 w-4 shrink-0" />
              </Badge>
            </Link>
            <h1 className="landing-title max-w-2xl font-outfit text-[clamp(2.2rem,5vw,4.2rem)] font-semibold leading-[0.96] tracking-[-0.045em]">
              <span>Create music with playable </span>
              <a href="https://strudel.cc/" target="_blank" rel="noopener noreferrer" className="group relative underline underline-offset-4 decoration-foreground/30 transition-colors hover:decoration-foreground">
                Strudel
                <Icons.arrowUpRight className="absolute -right-2 -top-1 h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
              </a>
            </h1>
            <p className="max-w-lg text-base font-medium leading-relaxed text-muted-foreground md:text-lg">
              Describe a sound. Stroop turns it into Strudel you can hear, edit, and keep shaping.
            </p>
            <Suspense fallback={null}>
              <LandingInput />
            </Suspense>
          </div>

          <div className="md:w-[45%]">
            <ExamplesCarousel />
          </div>
        </div>
      </div>
      {!isLoading && !isAuthenticated && <Footer />}
    </div>
  )
}

export default Page
