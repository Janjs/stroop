'use client'

import { createElement, Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useQuery } from 'convex/react'
import { ArrowRight, Pause, Play } from 'lucide-react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { StrudelSnippet } from '@/types/types'
import { loadStrudelRepl } from '@/lib/strudel-repl-loader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { buildStrudelTokenColorRules } from '@/lib/strudel-editor-theme'
import { Icons } from '@/components/icons'

type StrudelEditorElement = HTMLElement & {
  editor?: {
    setCode?: (code: string) => void
    evaluate?: () => void | Promise<unknown>
    start?: () => void
    stop?: () => void
  }
}

function SharedStroop() {
  const searchParams = useSearchParams()
  const chatId = searchParams.get('chatId')
  const title = searchParams.get('title') || 'Shared Stroop'
  const chat = useQuery(api.chats.getShared, chatId ? { id: chatId as Id<'chats'> } : 'skip')
  const snippet = (chat?.snippets?.[0] as StrudelSnippet | undefined)
  const editorRef = useRef<StrudelEditorElement | null>(null)
  const isPlayingRef = useRef(false)
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const { resolvedTheme } = useTheme()

  isPlayingRef.current = isPlaying

  useEffect(() => {
    void loadStrudelRepl()
    let frame = 0
    const init = () => {
      if (editorRef.current?.editor && snippet?.code) {
        editorRef.current.editor.setCode?.(snippet.code)
        setIsReady(true)
        return
      }
      frame = requestAnimationFrame(init)
    }
    frame = requestAnimationFrame(init)
    return () => {
      cancelAnimationFrame(frame)
      editorRef.current?.editor?.stop?.()
    }
  }, [snippet?.code])

  useEffect(() => {
    const stopPlayback = () => {
      editorRef.current?.editor?.stop?.()
      isPlayingRef.current = false
      setIsPlaying(false)
    }
    const stopWhenHidden = () => {
      if (document.hidden) stopPlayback()
    }
    window.addEventListener('blur', stopPlayback)
    window.addEventListener('pagehide', stopPlayback)
    document.addEventListener('visibilitychange', stopWhenHidden)
    return () => {
      window.removeEventListener('blur', stopPlayback)
      window.removeEventListener('pagehide', stopPlayback)
      document.removeEventListener('visibilitychange', stopWhenHidden)
      stopPlayback()
    }
  }, [])

  useEffect(() => {
    if (!isReady) return
    const root = getComputedStyle(document.documentElement)
    const get = (value: string) => root.getPropertyValue(value).trim() || 'inherit'
    const isDark = resolvedTheme === 'dark'
    const fg = isDark ? get('--foreground') : get('--popover-foreground')
    const primary = get('--editor-primary')
    const mutedFg = get('--muted-foreground')
    const secondary = get('--secondary')
    const accent = get('--editor-accent')
    const ring = get('--editor-ring')
    const style = document.createElement('style')
    style.id = 'strudel-shared-page-theme'
    style.textContent = buildStrudelTokenColorRules(['.strudel-share-preview'], {
      isDark,
      fg,
      mutedFg,
      primary,
      accent,
      secondary,
      ring,
    })
    document.head.appendChild(style)
    return () => style.remove()
  }, [isReady, resolvedTheme])

  const togglePlayback = async () => {
    const editor = editorRef.current?.editor
    if (!editor) return
    if (isPlayingRef.current) {
      editor.stop?.()
      isPlayingRef.current = false
      setIsPlaying(false)
      return
    }
    await editor.evaluate?.()
    editor.start?.()
    isPlayingRef.current = true
    setIsPlaying(true)
  }

  if (chat === undefined) {
    return <p className="text-sm text-muted-foreground">Loading shared Stroop…</p>
  }

  if (!chat || !snippet?.code) {
    return (
      <div className="space-y-4 text-center">
        <p className="font-outfit text-2xl font-semibold">This Stroop isn’t available</p>
        <Button asChild className="rounded-full"><Link href="/">Try Stroop</Link></Button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-xl space-y-3">
      <div className="flex items-center gap-2 px-1 text-muted-foreground">
        <Icons.music className="h-4 w-4" />
        <span className="text-sm font-medium">
          {chat.sharedBy ? `${chat.sharedBy} shared their Stroop creation` : 'Shared Stroop creation'}
        </span>
      </div>
      <Card className="overflow-hidden border-l-2 border-l-primary/40">
        <CardHeader className="px-5 pb-2 pt-4">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="truncate font-outfit text-base font-semibold">{chat.title || title}</CardTitle>
            <Button
              variant="outline"
              size="icon"
              className={`h-9 w-9 shrink-0 rounded-full ${isPlaying ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
              onPointerDown={(event) => {
                event.preventDefault()
                void togglePlayback()
              }}
              disabled={!isReady}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="ml-0.5 h-3.5 w-3.5" />}
            </Button>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">A generated Strudel pattern made with Stroop.</p>
        </CardHeader>
        <CardContent className="space-y-3 px-5 pb-4">
          <div className="strudel-share-preview overflow-hidden rounded-md bg-muted/60">
            <div className="flex items-center gap-1.5 border-b border-border/40 px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-red-400/60" />
              <span className="h-2 w-2 rounded-full bg-yellow-400/60" />
              <span className="h-2 w-2 rounded-full bg-green-400/60" />
              <span className="ml-2 font-mono text-[10px] text-muted-foreground/60">strudel</span>
            </div>
            <div className="h-[320px] overflow-auto">
              {createElement('strudel-editor', { ref: editorRef, className: 'h-0 w-full overflow-hidden' })}
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <Button asChild variant="ghost" size="sm" className="-ml-2 h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground">
              <Link href={`/generate?prompt=${encodeURIComponent(chat.title)}`}>Try this prompt <ArrowRight className="h-3 w-3" /></Link>
            </Button>
            <Button asChild className="rounded-full px-5">
              <Link href="/">Try Stroop</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SharedStroopPage() {
  return (
    <main className="flex min-h-[calc(100dvh-60px)] w-full items-center justify-center px-4 py-10">
      <Suspense fallback={null}><SharedStroop /></Suspense>
    </main>
  )
}
