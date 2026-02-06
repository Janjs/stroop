'use client'

import { createElement, useEffect, useRef, useState } from 'react'
import { StrudelSnippet } from '@/types/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Check, Copy, Minus, Pause, Play, Plus } from 'lucide-react'
import '@strudel/repl'
import { useTheme } from 'next-themes'

interface StrudelCodeViewerProps {
  snippets: StrudelSnippet[]
  isLoading?: boolean
  onCompileError?: (message: string, code: string) => void
  resetKey?: string | null
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

const StrudelCodeViewer = ({ snippets, isLoading = false, onCompileError, resetKey }: StrudelCodeViewerProps) => {
  const activeSnippet = snippets[0]
  const hasSnippet = Boolean(activeSnippet?.code?.trim())
  const [isCleared, setIsCleared] = useState(false)
  const lastResetKeyRef = useRef<string | null | undefined>(undefined)
  const replRef = useRef<StrudelEditorElement | null>(null)
  const [isEditorReady, setIsEditorReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasCopied, setHasCopied] = useState(false)
  const [replError, setReplError] = useState<{ message: string; range?: { from: number; to: number } } | null>(null)
  const copyTimeoutRef = useRef<number | null>(null)
  const { resolvedTheme } = useTheme()
  const baseHtmlClassesRef = useRef<string[]>([])
  const lastErrorKeyRef = useRef<string | null>(null)
  const lastCompileErrorKeyRef = useRef<string | null>(null)
  const strudelThemeSourceRef = useRef('')
  const [fontSize, setFontSize] = useState(14)


  useEffect(() => {
    const html = document.documentElement
    if (!baseHtmlClassesRef.current.length) {
      baseHtmlClassesRef.current = Array.from(html.classList).filter((item) => item !== 'light' && item !== 'dark')
    }
  }, [])

  useEffect(() => {
    const cacheAndNeutralize = (styleEl: HTMLStyleElement) => {
      if (styleEl.textContent?.trim()) {
        strudelThemeSourceRef.current = styleEl.textContent
        styleEl.textContent = ''
      }
    }
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList') {
          for (const node of m.addedNodes) {
            if (node instanceof HTMLStyleElement && node.id === 'strudel-theme-vars') {
              cacheAndNeutralize(node)
              return
            }
          }
        }
        if (
          m.type === 'characterData' &&
          m.target.parentElement instanceof HTMLStyleElement &&
          m.target.parentElement.id === 'strudel-theme-vars'
        ) {
          cacheAndNeutralize(m.target.parentElement)
          return
        }
      }
    })
    observer.observe(document.head, { childList: true, subtree: true, characterData: true })
    const existing = document.getElementById('strudel-theme-vars')
    if (existing instanceof HTMLStyleElement) cacheAndNeutralize(existing)
    return () => observer.disconnect()
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
    if (!isEditorReady || !replRef.current) return
    const cmTokenChar = '\u037C'
    const apply = () => {
      const container = replRef.current?.nextElementSibling as HTMLElement | null
      if (!container?.querySelector('.cm-editor')) return
      container.id = 'strudel-repl-container'
      const root = getComputedStyle(document.documentElement)
      const get = (v: string) => root.getPropertyValue(v).trim() || 'inherit'
      const bg = get('--background')
      const fg = get('--foreground')
      const muted = get('--muted')
      const border = get('--border')
      const accent = get('--accent')
      const accentFg = get('--accent-foreground')
      const ring = get('--ring')
      const radius = get('--radius')
      const fontMono = get('--font-mono') || 'monospace'
      const mutedFg = get('--muted-foreground')
      const primary = get('--primary')
      const secondary = get('--secondary')
      const accentColor = get('--accent')
      const ringColor = get('--ring')
      const themeEl = document.getElementById('strudel-theme-vars')
      if (themeEl instanceof HTMLStyleElement && themeEl.textContent?.trim()) {
        strudelThemeSourceRef.current = themeEl.textContent
        themeEl.textContent = ''
      }
      const isDark = resolvedTheme === 'dark'
      const pastel = (color: string) => isDark
        ? `color-mix(in oklab, ${color} 40%, ${fg})`
        : `color-mix(in oklab, ${color} 70%, ${fg})`
      const palette = [
        pastel(primary),
        pastel(accentColor),
        pastel(secondary),
        pastel(mutedFg),
        pastel(ringColor),
        pastel(fg),
      ]
      const tokenClasses = new Set<string>()
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            const r = rule as CSSStyleRule
            if (r.selectorText?.includes(cmTokenChar) && r.style?.color) {
              const matches = r.selectorText.match(new RegExp(`${cmTokenChar}[\\da-zA-Z]+`, 'g'))
              matches?.forEach((m) => tokenClasses.add(m))
            }
          }
        } catch (_) {}
      }
      let tokenRules = ''
      let idx = 0
      tokenClasses.forEach((cls) => {
        const color = palette[idx % palette.length]
        tokenRules += `#strudel-repl-container .cm-editor .${cls}{color:${color} !important;}`
        idx += 1
      })
      const id = 'strudel-app-theme'
      let styleEl = document.getElementById(id) as HTMLStyleElement | null
      if (!styleEl) {
        styleEl = document.createElement('style')
        styleEl.id = id
      }
      styleEl.textContent = `
#strudel-repl-container .cm-editor,#strudel-repl-container .cm-scroller,#strudel-repl-container .cm-content,#strudel-repl-container .cm-line{font-family:${fontMono};font-weight:500;font-size:${fontSize}px;}
#strudel-repl-container .cm-editor{background-color:${bg} !important;color:${fg} !important;border-radius:${radius};}
#strudel-repl-container .cm-scroller{background-color:${bg} !important;}
#strudel-repl-container .cm-content{color:${fg} !important;}
#strudel-repl-container .cm-gutters{background-color:${muted} !important;border-color:${border};}
#strudel-repl-container .cm-activeLineGutter{background-color:${accent} !important;color:${accentFg} !important;}
#strudel-repl-container .cm-activeLine{background-color:${muted} !important;}
#strudel-repl-container .cm-selectionMatch,#strudel-repl-container .cm-selectionBackground{background-color:${accent} !important;}
#strudel-repl-container .cm-editor.cm-focused{outline-color:${ring};}
#strudel-repl-container .cm-cursor{border-left-color:${fg};}
${tokenRules}
`
      document.head.appendChild(styleEl)
    }
    const raf = window.requestAnimationFrame(() => apply())
    const late = window.setTimeout(() => apply(), 300)
    return () => {
      window.cancelAnimationFrame(raf)
      window.clearTimeout(late)
      document.getElementById('strudel-app-theme')?.remove()
    }
  }, [isEditorReady, resolvedTheme, fontSize])

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const repl = replRef.current
    if (!repl) return
    if (!activeSnippet?.code) {
      if (repl.editor?.setCode) {
        repl.editor.setCode('')
        repl.editor.stop?.()
      } else {
        repl.setAttribute('code', '')
        repl.editor?.stop?.()
      }
      setIsPlaying(false)
      setReplError(null)
      return
    }
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
      if (!normalizedCode.trim()) return
      if (!repl.editor) return
      try {
        const result = repl.editor.evaluate?.(false)
        if (result && typeof (result as Promise<unknown>).then === 'function') {
          void (result as Promise<unknown>).catch((error) => {
            const message = error instanceof Error ? error.message : String(error)
            if (!message.toLowerCase().includes('no code to evaluate')) {
              throw error
            }
          })
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        if (!message.toLowerCase().includes('no code to evaluate')) {
          throw error
        }
      }
    })
  }, [activeSnippet?.code, isEditorReady])

  useEffect(() => {
    const repl = replRef.current
    if (!repl) return
    if (repl.editor?.setCode) {
      repl.editor.setCode('')
      repl.editor.stop?.()
    } else {
      repl.setAttribute('code', '')
      repl.editor?.stop?.()
    }
    setIsPlaying(false)
    setReplError(null)
  }, [resetKey])

  useEffect(() => {
    if (resetKey !== lastResetKeyRef.current) {
      lastResetKeyRef.current = resetKey
      setIsCleared(true)
    }
  }, [resetKey])

  useEffect(() => {
    if (hasSnippet) {
      setIsCleared(false)
    }
  }, [hasSnippet, activeSnippet?.code])

  useEffect(() => {
    if (!replError || !activeSnippet?.code || !onCompileError) return
    const errorKey = `${replError.message}:${activeSnippet.code}`
    if (lastCompileErrorKeyRef.current === errorKey) return
    lastCompileErrorKeyRef.current = errorKey
    onCompileError(replError.message, activeSnippet.code)
  }, [replError, activeSnippet?.code, onCompileError])

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
        {!hasSnippet || isCleared ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {isLoading ? 'Generating Strudel code...' : 'Your Strudel code will appear here.'}
          </div>
        ) : (
          <>
            <div className="relative flex-1 min-h-0">
              {createElement('strudel-editor', { ref: replRef, className: 'w-full flex-none h-0 min-h-0 overflow-hidden' })}
              {replError ? (
                <div className="absolute bottom-12 left-2 right-2 z-10">
                  <Alert variant="destructive">
                    <AlertTitle>Strudel syntax error</AlertTitle>
                    <AlertDescription>{replError.message}</AlertDescription>
                  </Alert>
                </div>
              ) : null}
              <div className="absolute bottom-3 right-3 z-10 flex flex-col items-end gap-2">
                <div className="flex items-center gap-1 rounded-md bg-background/80 backdrop-blur-sm border">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setFontSize((s) => Math.max(10, s - 1))} aria-label="Decrease font size">
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-xs tabular-nums w-6 text-center select-none">{fontSize}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setFontSize((s) => Math.min(24, s + 1))} aria-label="Increase font size">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-9 w-9 bg-background/80 backdrop-blur-sm" onClick={handleCopy} aria-label="Copy code" disabled={!activeSnippet?.code}>
                    {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button className="bg-primary/90 backdrop-blur-sm" onClick={handleTogglePlayback} aria-label={isPlaying ? 'Pause' : 'Play'} disabled={!isEditorReady || Boolean(replError)}>
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {isPlaying ? 'Pause' : 'Play'}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default StrudelCodeViewer
