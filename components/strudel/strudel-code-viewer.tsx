'use client'

import { createElement, useEffect, useRef, useState } from 'react'
import { StrudelSnippet } from '@/types/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pause, Play, Square } from 'lucide-react'
import '@strudel/repl'

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
      return
    }
    repl.setAttribute('code', normalizedCode)
  }, [activeSnippet?.code])

  const handlePlay = async () => {
    const repl = replRef.current
    if (!repl?.editor) return
    try {
      const result = repl.editor.evaluate?.()
      if (result && typeof (result as Promise<unknown>).then === 'function') {
        await result
      }
      repl.editor.start?.()
    } catch (error) {
      console.error('Failed to start Strudel playback:', error)
    }
  }

  const handlePause = () => {
    replRef.current?.editor?.stop?.()
  }

  const handleStop = () => {
    replRef.current?.editor?.stop?.()
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
            {createElement('strudel-editor', { ref: replRef, className: 'w-full h-64 flex-none overflow-hidden' })}
            <div className="flex items-center justify-end gap-2 px-4 py-3 flex-none">
              <Button variant="outline" size="icon" onClick={handleStop} aria-label="Stop" disabled={!isEditorReady}>
                <Square className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handlePause} aria-label="Pause" disabled={!isEditorReady}>
                <Pause className="h-4 w-4" />
              </Button>
              <Button size="icon" onClick={handlePlay} aria-label="Play" disabled={!isEditorReady}>
                <Play className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default StrudelCodeViewer
