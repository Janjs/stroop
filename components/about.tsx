import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { GITHUB_LINK, TWITTER_LINK } from '@/lib/utils'

interface AboutProps {
  variant?: 'default' | 'icon'
}

export default function About({ variant = 'default' }: AboutProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {variant === 'icon' ? (
          <Button variant="ghost" size="icon">
            <Icons.info className="h-4 w-4" />
          </Button>
        ) : (
          <button className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus-visible:bg-accent focus-visible:text-accent-foreground hover:bg-accent hover:text-accent-foreground w-full">
            <Icons.info className="h-4 w-4" />
            <span>About</span>
          </button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-medium">Welcome to Stroop🎵✨</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="text-md space-y-2">
          <p>
            Stroop is an <b className="font-bold">AI-powered Strudel generator</b> for live-coding music.
          </p>
          <p className="font-light">
            Whether you're a <b className="font-bold">producer🧠</b> shaping a new groove or a <b className="font-bold">performer🎛️</b> exploring
            fresh patterns, Stroop is here to <b className="font-bold">amplify your musical creativity.</b>
          </p>
          <p className="font-light">
            Describe the vibe, tempo, or style, and Stroop will generate Strudel code snippets you can drop right into
            your session.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Made by
          <a href={TWITTER_LINK} target="_blank" className="underline underline-offset-4">
            {' '}
            @Janjs
          </a>
          . Source is AGPL-3.0.
        </p>
        <p className="text-xs text-muted-foreground">
          <a href="/legal/privacy" className="underline-offset-4 hover:underline">Privacy</a>
          {' · '}
          <a href="/legal/terms" className="underline-offset-4 hover:underline">Terms</a>
          {' · '}
          <a href="/legal/refunds" className="underline-offset-4 hover:underline">Refunds</a>
        </p>
        <AlertDialogFooter>
          <div className="hidden sm:flex">
            <a href={GITHUB_LINK}>
              <Button variant="ghost" size="icon">
                <Icons.gitHub className="w-4 h-4 inline" />
              </Button>
            </a>
            <a href={TWITTER_LINK}>
              <Button variant="ghost" size="icon">
                <Icons.twitter className="w-4 h-4 inline" />
              </Button>
            </a>
          </div>
          <AlertDialogCancel>close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
