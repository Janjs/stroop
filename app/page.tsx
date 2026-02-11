'use client'

import { Suspense } from 'react'
import LandingInput from '@/components/landing/landing-input'
import ExamplesCarousel from '@/components/landing/examples-carousel'
import { Icons } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const Page = () => {
  return (
    <div className="flex min-h-[calc(100dvh-60px)] w-full max-w-full md:items-center justify-center px-4 py-8 md:px-8 lg:px-12">
      <div className="flex w-full max-w-6xl flex-col gap-12 md:flex-row md:items-center md:gap-10 lg:gap-16">
        <div className="flex flex-col gap-4 md:w-[55%]">
          <Link
            href="https://chordwise.chat"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Badge
              variant="outline"
              className="flex h-7 w-fit cursor-pointer items-center gap-2 border-foreground/20 bg-card/80 shadow-sm backdrop-blur transition-colors hover:bg-card/90"
            >
              <span className="leading-none">Try chordwise too!</span>
              <Icons.chordwiseMascot className="h-4 w-4 shrink-0" />
            </Badge>
          </Link>
          <h1 className="text-3xl md:text-5xl font-bold flex flex-wrap items-start gap-x-2 gap-y-1 font-outfit">
            <span>Create playable</span>
            <a href="https://strudel.cc/" target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-0.5 underline underline-offset-4 decoration-foreground/30 hover:decoration-foreground transition-colors">
              Strudel
              <Icons.arrowUpRight className="h-5 w-5 md:h-5 md:w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            <span>code</span>
          </h1>
          <h3 className="text-sm md:text-lg text-muted-foreground">
            Generate Strudel code snippets for live-coding music
          </h3>
          <Suspense fallback={null}>
            <LandingInput />
          </Suspense>
        </div>

        <div className="md:w-[45%]">
          <ExamplesCarousel />
        </div>
      </div>
    </div>
  )
}

export default Page
