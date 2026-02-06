'use client'

import { createElement, useEffect, useRef, useState } from 'react'
import { StrudelSnippet } from '@/types/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Check, Copy, Pause, Play } from 'lucide-react'
import '@strudel/repl'
import { useTheme } from 'next-themes'

interface StrudelCodeViewerProps {
  snippets: StrudelSnippet[]
  isLoading?: boolean
}

type StrudelEditorElement = HTMLElement & {
  editor?: {
    setCode?: (code: string) => void
    evaluate?: (autostart?: boolean) => void | Promise<unknown>
    start?: () => void
    stop?: () => void
    flash?: (ms?: number, range?: { from: number; to: number }) => void
    setCursorLocation?: (col: number) => void
  }
}

const normalizeStrudelCode = (code: string) => {
  let next = code.trim()
  for (let i = 0; i < 3; i += 1) {
    const hasKnownInvalidPattern = /\bplay\s*\(|\bloop\s*=|\bshape\s*=|\bsynth\s*=|note\(\s*\d/.test(next)
    if (hasKnownInvalidPattern) {
      return 'stack(s("bd bd sd bd"), s("hh*8")).fast(1)'
    }
    const hasSynthReference = /\bsynth\b/.test(next)
    const hasSynthDefinition = /\b(const|let|var|function)\s+synth\b/.test(next)
    const normalized = !hasSynthReference || hasSynthDefinition ? next : `const synth = s\n\n${next}`
    if (normalized === next) return normalized
    next = normalized
  }
  return next
}

const getOffsetFromLineColumn = (code: string, line: number, column: number) => {
  if (line <= 0) return 0
  const lines = code.split('\n')
  const safeLine = Math.min(line, lines.length)
  let offset = 0
  for (let i = 0; i < safeLine - 1; i += 1) {
    offset += lines[i].length + 1
  }
  return Math.min(offset + Math.max(column, 0), code.length)
}

const getErrorRange = (error: unknown, code: string) => {
  if (!code || typeof error !== 'object' || error === null) return null
  const err = error as {
    pos?: number
    start?: number | { offset?: number }
    end?: number | { offset?: number }
    loc?: { line?: number; column?: number; start?: { offset?: number } }
    location?: { start?: { offset?: number; line?: number; column?: number }; end?: { offset?: number } }
    line?: number
    column?: number
  }

  const startOffset =
    (typeof err.location?.start?.offset === 'number' ? err.location.start.offset : undefined) ??
    (typeof err.loc?.start?.offset === 'number' ? err.loc.start.offset : undefined) ??
    (typeof err.start === 'number' ? err.start : undefined) ??
    (typeof err.start === 'object' && typeof err.start.offset === 'number' ? err.start.offset : undefined) ??
    (typeof err.pos === 'number' ? err.pos : undefined)

  const endOffset =
    (typeof err.location?.end?.offset === 'number' ? err.location.end.offset : undefined) ??
    (typeof err.end === 'number' ? err.end : undefined) ??
    (typeof err.end === 'object' && typeof err.end.offset === 'number' ? err.end.offset : undefined)

  if (typeof startOffset === 'number') {
    const from = Math.min(Math.max(startOffset, 0), code.length)
    const to =
      typeof endOffset === 'number'
        ? Math.min(Math.max(endOffset, from + 1), code.length)
        : Math.min(from + 1, code.length)
    return { from, to }
  }

  const line = err.loc?.line ?? err.location?.start?.line ?? err.line
  const column = err.loc?.column ?? err.location?.start?.column ?? err.column
  if (typeof line === 'number' && typeof column === 'number') {
    const from = getOffsetFromLineColumn(code, line, column)
    const to = Math.min(from + 1, code.length)
    return { from, to }
  }

  return null
}

const StrudelCodeViewer = ({ snippets, isLoading = false }: StrudelCodeViewerProps) => {
  const activeSnippet = snippets[0]
  const replRef = useRef<StrudelEditorElement | null>(null)
  const [isEditorReady, setIsEditorReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasCopied, setHasCopied] = useState(false)
  const [replError, setReplError] = useState<{ message: string; range?: { from: number; to: number } } | null>(null)
  const copyTimeoutRef = useRef<number | null>(null)
  const { resolvedTheme } = useTheme()
  const baseHtmlClassesRef = useRef<string[]>([])
  const lockedThemeVarsRef = useRef<Record<string, string>>({})
  const lastErrorKeyRef = useRef<string | null>(null)

  useEffect(() => {
    const styleId = 'strudel-page-lock'
    const existing = document.getElementById(styleId)
    if (existing) return
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      html, body {
        background: var(--color-background) !important;
        color: var(--color-foreground) !important;
      }
    `
    document.head.appendChild(style)
    return () => {
      style.remove()
    }
  }, [])

  useEffect(() => {
    const html = document.documentElement
    if (!baseHtmlClassesRef.current.length) {
      baseHtmlClassesRef.current = Array.from(html.classList).filter((item) => item !== 'light' && item !== 'dark')
    }
  }, [])

  useEffect(() => {
    if (!resolvedTheme) return
    const html = document.documentElement
    const themeClass = resolvedTheme === 'dark' ? 'dark' : 'light'
    const applyTheme = () => {
      html.className = [...baseHtmlClassesRef.current, themeClass].join(' ')
    }
    applyTheme()
    const observer = new MutationObserver(() => {
      const hasTheme = html.classList.contains(themeClass)
      const hasBase = baseHtmlClassesRef.current.every((item) => html.classList.contains(item))
      if (!hasTheme || !hasBase) {
        applyTheme()
      }
    })
    observer.observe(html, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [resolvedTheme])

  useEffect(() => {
    if (!resolvedTheme) return
    const html = document.documentElement
    const themeVarPrefixes = [
      '--background',
      '--foreground',
      '--card',
      '--popover',
      '--primary',
      '--secondary',
      '--muted',
      '--accent',
      '--destructive',
      '--border',
      '--input',
      '--ring',
      '--chart-',
      '--sidebar',
      '--font-',
      '--radius',
      '--shadow-',
      '--tracking-',
      '--spacing',
    ]
    const computed = window.getComputedStyle(html)
    const nextVars: Record<string, string> = {}
    for (let i = 0; i < computed.length; i += 1) {
      const name = computed.item(i)
      if (!name.startsWith('--')) continue
      if (!themeVarPrefixes.some((prefix) => name.startsWith(prefix))) continue
      nextVars[name] = computed.getPropertyValue(name)
    }
    lockedThemeVarsRef.current = nextVars
    const applyLockedVars = () => {
      Object.entries(lockedThemeVarsRef.current).forEach(([name, value]) => {
        html.style.setProperty(name, value, 'important')
      })
    }
    applyLockedVars()
    const observer = new MutationObserver(() => applyLockedVars())
    observer.observe(html, { attributes: true, attributeFilter: ['style'] })
    return () => observer.disconnect()
  }, [resolvedTheme])

  useEffect(() => {
    let frameId = 0
    const checkReady = () => {
      if (replRef.current?.editor) {
        setIsEditorReady(true)
        return
      }
      frameId = window.requestAnimationFrame(checkReady)
    }
    frameId = window.requestAnimationFrame(checkReady)
    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!activeSnippet?.code) return
    const repl = replRef.current
    if (!repl) return
    const normalizedCode = normalizeStrudelCode(activeSnippet.code)
    if (repl.editor?.setCode) {
      repl.editor.setCode(normalizedCode)
      repl.editor.stop?.()
      setIsPlaying(false)
    } else {
      repl.setAttribute('code', normalizedCode)
      repl.editor?.stop?.()
      setIsPlaying(false)
    }
    setReplError(null)
    window.requestAnimationFrame(() => {
      const scroller = repl.shadowRoot?.querySelector('.cm-scroller')
      if (scroller instanceof HTMLElement) {
        scroller.scrollTop = 0
      }
    })
    window.requestAnimationFrame(() => {
      void repl.editor?.evaluate?.(false)
    })
  }, [activeSnippet?.code])

  useEffect(() => {
    const repl = replRef.current
    if (!repl) return
    const handleUpdate = (event: Event) => {
      const detail = (event as CustomEvent).detail as { error?: unknown; code?: string } | undefined
      const error = detail?.error
      if (!error) {
        lastErrorKeyRef.current = null
        setReplError(null)
        return
      }
      const message = error instanceof Error ? error.message : String(error)
      const code = detail?.code ?? ''
      const range = getErrorRange(error, code) ?? undefined
      const errorKey = `${message}:${range ? `${range.from}-${range.to}` : 'none'}`
      repl.editor?.stop?.()
      setIsPlaying(false)
      setReplError({ message, range })
      if (errorKey !== lastErrorKeyRef.current) {
        lastErrorKeyRef.current = errorKey
        if (range) {
          repl.editor?.setCursorLocation?.(range.from)
          repl.editor?.flash?.(900, range)
        }
      }
    }
    repl.addEventListener('update', handleUpdate)
    return () => repl.removeEventListener('update', handleUpdate)
  }, [isEditorReady])

  const handleTogglePlayback = async () => {
    const repl = replRef.current
    if (!repl?.editor) return
    if (isPlaying) {
      repl.editor.stop?.()
      setIsPlaying(false)
      return
    }
    try {
      const result = repl.editor.evaluate?.()
      if (result && typeof (result as Promise<unknown>).then === 'function') {
        await result
      }
      repl.editor.start?.()
      setIsPlaying(true)
    } catch (error) {
      console.error('Failed to start Strudel playback:', error)
    }
  }

  const handleCopy = async () => {
    if (!activeSnippet?.code) return
    try {
      await navigator.clipboard.writeText(activeSnippet.code)
      setHasCopied(true)
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current)
      }
      copyTimeoutRef.current = window.setTimeout(() => {
        setHasCopied(false)
      }, 1500)
    } catch (error) {
      console.error('Failed to copy Strudel code:', error)
    }
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardContent className="flex-1 min-h-0 flex flex-col p-0">
        {snippets.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {isLoading ? 'Generating Strudel code...' : 'Your Strudel code will appear here.'}
          </div>
        ) : (
          <>
            {createElement('strudel-editor', { ref: replRef, className: 'w-full flex-none h-0 min-h-0 overflow-hidden' })}
            {replError ? (
              <div className="px-4 pb-3">
                <Alert variant="destructive">
                  <AlertTitle>Strudel syntax error</AlertTitle>
                  <AlertDescription>{replError.message}</AlertDescription>
                </Alert>
              </div>
            ) : null}
            <div className="flex items-center justify-end gap-2 px-4 py-3 flex-none">
              <Button variant="outline" onClick={handleCopy} aria-label="Copy code" disabled={!activeSnippet?.code}>
                {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {hasCopied ? 'Copied' : 'Copy'}
              </Button>
              <Button
                onClick={handleTogglePlayback}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                disabled={!isEditorReady || Boolean(replError)}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default StrudelCodeViewer
