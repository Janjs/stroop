'use client'

import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { GITHUB_LINK, TWITTER_LINK } from '@/lib/utils'
import { navigateToGithub } from './_actions'
import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()
  return (
    <div
      className={`
    ${pathname === '/' ? 'pt-6 bg-gradient-to-t from-background from-60%' : 'hidden'}
    md:flex gap-4 items-center justify-end px-4 flex-shrink-0
    `}
    >
      <p className="max-w-7xl w-full px-4 pb-2 text-right text-xs text-muted-foreground">
        <HoverCard>
          <HoverCardTrigger className="hover:cursor-pointer">
            💻 by{' '}
            <Button
              onClick={(e) => navigateToGithub()}
              variant="link"
              className="hover:underline hover:underline-offset-4 text-xs p-0 h-auto"
            >
              @Janjs.
            </Button>{' '}
          </HoverCardTrigger>
          <HoverCardContent className="w-25">
            <div className="grid grid-rows-2 gap-4 text-start text-md text-foreground items-center">
              <a href={GITHUB_LINK} className="flex items-center">
                <Icons.gitHub className="w-3 h-3 mr-2 inline text-muted-foreground" />{' '}
                <p className="inline hover:underline hover:underline-offset-4">Janjs</p>
              </a>
              <a href={TWITTER_LINK} className="flex items-center">
                <Icons.twitter className="w-3 h-3 mr-2 inline text-muted-foreground hover:underline hover:underline-offset-4" />{' '}
                <p className="inline hover:underline hover:underline-offset-4">Janjijs</p>
              </a>
            </div>
          </HoverCardContent>
        </HoverCard>
      </p>
    </div>
  )
}
