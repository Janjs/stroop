'use client'

import { createElement, useEffect, useRef, useState } from 'react'
import { StrudelSnippet } from '@/types/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pause, Play } from 'lucide-react'
import '@strudel/repl'
import { useTheme } from 'next-themes'

interface StrudelCodeViewerProps {
  snippets: StrudelSnippet[]
  isLoading?: boolean
}

type StrudelEditorElement = HTMLElement & {
  editor?: {
    setCode?: (code: string) => void
    evaluate?: () => void
    start?: () => void
    stop?: () => void
  }
}

const normalizeStrudelCode = (code: string) => {
  const trimmed = code.trim()
  const hasKnownInvalidPattern = /\bplay\s*\(|\bloop\s*=|\bshape\s*=|\bsynth\s*=|note\(\s*\d/.test(trimmed)
  if (hasKnownInvalidPattern) {
    return 'stack(s("bd bd sd bd"), s("hh*8")).fast(1)'
  }
  const hasSynthReference = /\bsynth\b/.test(trimmed)
  const hasSynthDefinition = /\b(const|let|var|function)\s+synth\b/.test(trimmed)
  if (!hasSynthReference || hasSynthDefinition) return trimmed
  return `const synth = s\n\n${trimmed}`
}

const StrudelCodeViewer = ({ snippets, isLoading = false }: StrudelCodeViewerProps) => {
  const activeSnippet = snippets[0]
  const replRef = useRef<StrudelEditorElement | null>(null)
  const [isEditorReady, setIsEditorReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const { resolvedTheme } = useTheme()
  const baseHtmlClassesRef = useRef<string[]>([])
  const lockedThemeVarsRef = useRef<Record<string, string>>({})

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
    window.requestAnimationFrame(() => {
      const scroller = repl.shadowRoot?.querySelector('.cm-scroller')
      if (scroller instanceof HTMLElement) {
        scroller.scrollTop = 0
      }
    })
  }, [activeSnippet?.code])

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
            <div className="flex items-center justify-end px-4 py-3 flex-none">
              <Button onClick={handleTogglePlayback} aria-label={isPlaying ? 'Pause' : 'Play'} disabled={!isEditorReady}>
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
