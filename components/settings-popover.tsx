'use client'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'
import { useTheme } from 'next-themes'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useAnonymousSession } from '@/hooks/useAnonymousSession'
import About from '@/components/about'

export default function SettingsPopover() {
  const { theme, setTheme } = useTheme()
  const anonymousSessionId = useAnonymousSession()
  const credits = useQuery(api.credits.getCredits, { anonymousSessionId: anonymousSessionId ?? undefined })

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Icons.settings className="h-4 w-4" />
          <span className="sr-only">Settings</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="end">
        <div className="flex flex-col">
          <div className="px-3 py-2.5">
            <div className="text-xs font-medium text-muted-foreground mb-2 px-2">Preferences</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-sm">Theme</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-7 w-7 ${(theme === 'system' || (!theme)) ? 'bg-accent' : ''}`}
                    onClick={() => setTheme('system')}
                  >
                    <Icons.laptop className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-7 w-7 ${theme === 'light' ? 'bg-accent' : ''}`}
                    onClick={() => setTheme('light')}
                  >
                    <Icons.sun className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-7 w-7 ${theme === 'dark' ? 'bg-accent' : ''}`}
                    onClick={() => setTheme('dark')}
                  >
                    <Icons.moon className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <Separator />
          <div className="p-1">
            <div className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm w-full">
              <Icons.credits className="h-4 w-4" />
              <span>Credits</span>
              {credits && (
                <Badge variant="outline" className="ml-auto text-xs">
                  {credits.isAuthenticated 
                    ? credits.credits?.toFixed(2) ?? '0.00'
                    : `${credits.credits} / 3`
                  }
                </Badge>
              )}
            </div>
            <About />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
