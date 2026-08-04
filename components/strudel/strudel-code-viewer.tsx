'use client'

import { createElement, forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { EditorSelectionContext, StrudelSnippet } from '@/types/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { LoadingButton, type LoadingButtonHandle } from '@/components/interior/loading-button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Check, Copy, MessageSquare, Minus, Plus, Share2 } from 'lucide-react'
import { MorphButton } from '@/components/interior/morph-button'
import { loadStrudelRepl } from '@/lib/strudel-repl-loader'
import {
  configureStrudelEditor,
  evaluateStrudelEditor,
  getStrudelEditorCode,
  getStrudelEditorSelection,
  getStrudelEditorSelectionUI,
  playStrudelEditor,
  setStrudelEditorCode,
  subscribeStrudelEditorChanges,
  subscribeStrudelEditorSelection,
  updateStrudelEditorCode,
  type EditorSelectionUI,
  type StrudelEditorElement,
} from '@/lib/strudel-editor-code'
import { useTheme } from 'next-themes'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { useAnonymousSession } from '@/hooks/useAnonymousSession'
import { cn } from '@/lib/utils'
import { buildStrudelTokenColorRules } from '@/lib/strudel-editor-theme'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export type StrudelCodeViewerHandle = {
  getCurrentCode: () => string
  getSelection: () => EditorSelectionContext | null
  save: () => Promise<boolean>
  saveWithCode: (code: string) => Promise<boolean>
  applyCode: (code: string) => void
}

interface StrudelCodeViewerProps {
  snippets: StrudelSnippet[]
  persistedCode?: string | null
  isCodeStreaming?: boolean
  isLoading?: boolean
  onFixInChat?: (message: string, code: string) => void
  onAddSelectionToContext?: (selection: EditorSelectionContext) => void
  onCodeSaved?: (code: string) => void
  onEnsureChat?: (code: string) => Promise<void>
  resetKey?: string | null
  chatId?: string
  shareTitle?: string
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

const BUFFER_LINES = 10
const LINE_HEIGHT_RATIO = 1.5

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

const StrudelCodeViewer = forwardRef<StrudelCodeViewerHandle, StrudelCodeViewerProps>(function StrudelCodeViewer(
  { snippets, persistedCode = null, isCodeStreaming = false, isLoading = false, onFixInChat, onAddSelectionToContext, onCodeSaved, onEnsureChat, resetKey, chatId, shareTitle },
  ref,
) {
  const activeSnippet = snippets[0]
  const effectiveCode = activeSnippet?.code?.trim() || persistedCode?.trim() || ''
  const [hasEditorCode, setHasEditorCode] = useState(Boolean(effectiveCode))
  const replRef = useRef<StrudelEditorElement | null>(null)
  const editorContainerRef = useRef<HTMLDivElement | null>(null)
  const sharePreviewRef = useRef<StrudelEditorElement | null>(null)
  const [isEditorReady, setIsEditorReady] = useState(false)
  const [isEditorInitialized, setIsEditorInitialized] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const isPlayingRef = useRef(false)
  isPlayingRef.current = isPlaying
  const [isSharePlaying, setIsSharePlaying] = useState(false)
  const isSharePlayingRef = useRef(false)
  isSharePlayingRef.current = isSharePlaying
  const [isSharePreviewReady, setIsSharePreviewReady] = useState(false)
  const [hasCopied, setHasCopied] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [saveButtonVisible, setSaveButtonVisible] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [hasShared, setHasShared] = useState(false)
  const [replError, setReplError] = useState<{ message: string; range?: { from: number; to: number } } | null>(null)
  const replErrorRef = useRef<{ message: string; range?: { from: number; to: number } } | null>(null)
  replErrorRef.current = replError
  const copyTimeoutRef = useRef<number | null>(null)
  const saveButtonRef = useRef<LoadingButtonHandle>(null)
  const hasUnsavedChangesRef = useRef(false)
  hasUnsavedChangesRef.current = hasUnsavedChanges
  const liveEvaluationTimeoutRef = useRef<number | null>(null)
  const isApplyingExternalCodeRef = useRef(false)
  const { resolvedTheme } = useTheme()
  const lastErrorKeyRef = useRef<string | null>(null)
  const [fontSize, setFontSize] = useState(14)
  const [selectionUI, setSelectionUI] = useState<EditorSelectionUI | null>(null)
  const onAddSelectionToContextRef = useRef(onAddSelectionToContext)
  onAddSelectionToContextRef.current = onAddSelectionToContext
  const activeCodeRef = useRef(effectiveCode)
  activeCodeRef.current = effectiveCode
  const lastSetNormalizedCodeRef = useRef<string>('')
  const lastEvaluatedCodeRef = useRef<string>('')
  const lastSavedCodeRef = useRef(activeSnippet?.code || '')
  const currentEditorCodeRef = useRef(activeSnippet?.code || '')
  const makeShareable = useMutation(api.chats.makeShareable)
  const updateChat = useMutation(api.chats.update)
  const anonymousSessionId = useAnonymousSession()
  const handleSaveCodeRef = useRef<(force?: boolean, codeOverride?: string) => Promise<boolean>>(async () => false)
  const applyCodeRef = useRef<(code: string) => void>(() => {})

  useImperativeHandle(ref, () => ({
    getCurrentCode: () => getCurrentEditorCode(),
    getSelection: () => getStrudelEditorSelection(replRef.current),
    save: () => handleSaveCodeRef.current(true),
    saveWithCode: (code: string) => handleSaveCodeRef.current(true, code),
    applyCode: (code: string) => applyCodeRef.current(code),
  }), [])

  useEffect(() => {
    void loadStrudelRepl()
  }, [])

  useEffect(() => {
    if (hasUnsavedChanges) setSaveButtonVisible(true)
  }, [hasUnsavedChanges])

  useEffect(() => {
    if (!isEditorReady || !isEditorInitialized) return
    return subscribeStrudelEditorSelection(replRef.current, editorContainerRef.current, setSelectionUI)
  }, [isEditorReady, isEditorInitialized])

  useEffect(() => {
    const container = editorContainerRef.current
    if (!isEditorReady || !isEditorInitialized || !container) return

    const handleEditorChange = (code: string) => {
      if (isApplyingExternalCodeRef.current) return
      currentEditorCodeRef.current = code
      setHasEditorCode(Boolean(code.trim()))
      const isDirty = normalizeStrudelCode(code) !== normalizeStrudelCode(lastSavedCodeRef.current)
      setHasUnsavedChanges(isDirty)
      if (!isPlayingRef.current) return
      if (liveEvaluationTimeoutRef.current !== null) {
        window.clearTimeout(liveEvaluationTimeoutRef.current)
      }
      liveEvaluationTimeoutRef.current = window.setTimeout(async () => {
        liveEvaluationTimeoutRef.current = null
        const repl = replRef.current
        const nextCode = getStrudelEditorCode(repl)
        if (!repl?.editor || !nextCode.trim() || nextCode === lastEvaluatedCodeRef.current) return
        try {
          await evaluateStrudelEditor(repl, false)
          currentEditorCodeRef.current = nextCode
          lastEvaluatedCodeRef.current = nextCode
        } catch (error) {
          console.error('Failed to live evaluate Strudel code:', error)
        }
      }, 250)
    }

    return subscribeStrudelEditorChanges(replRef.current, container, handleEditorChange)
  }, [isEditorReady, isEditorInitialized])

  useEffect(() => {
    if (!isEditorInitialized) return
    const scroller = (replRef.current?.nextElementSibling as HTMLElement | null)?.querySelector('.cm-scroller') as HTMLElement | null
    if (!scroller) return

    let timeoutId: number | null = null
    const handleScroll = () => {
      scroller.classList.add('is-scrolling')
      if (timeoutId !== null) window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => {
        scroller.classList.remove('is-scrolling')
        timeoutId = null
      }, 800)
    }

    scroller.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      scroller.removeEventListener('scroll', handleScroll)
      if (timeoutId !== null) window.clearTimeout(timeoutId)
      scroller.classList.remove('is-scrolling')
    }
  }, [isEditorInitialized])

  useEffect(() => {
    if (!isEditorReady) return
    setSelectionUI((current) => {
      if (!current) return current
      return getStrudelEditorSelectionUI(replRef.current, editorContainerRef.current) ?? null
    })
  }, [fontSize, isEditorReady])

  useEffect(() => {
    if (!isShareOpen || !activeSnippet?.code) return
    let frame = 0
    const setPreviewCode = () => {
      if (sharePreviewRef.current?.editor?.setCode) {
        sharePreviewRef.current.editor.setCode(currentEditorCodeRef.current || activeSnippet.code)
        setIsSharePreviewReady(true)
        return
      }
      frame = window.requestAnimationFrame(setPreviewCode)
    }
    frame = window.requestAnimationFrame(setPreviewCode)
    return () => {
      window.cancelAnimationFrame(frame)
      sharePreviewRef.current?.editor?.stop?.()
      setIsSharePlaying(false)
      setIsSharePreviewReady(false)
    }
  }, [isShareOpen, activeSnippet?.code])

  useEffect(() => {
    const repl = replRef.current
    const stopPlayback = () => {
      repl?.editor?.stop?.()
      setIsPlaying(false)
    }
    window.addEventListener('blur', stopPlayback)
    return () => {
      window.removeEventListener('blur', stopPlayback)
      stopPlayback()
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
    if (!isEditorReady || !replRef.current) return
    const apply = () => {
      const container = replRef.current?.nextElementSibling as HTMLElement | null
      if (!container?.querySelector('.cm-editor')) return
      configureStrudelEditor(replRef.current)
      container.id = 'strudel-repl-container'
      const root = getComputedStyle(document.documentElement)
      const get = (v: string) => root.getPropertyValue(v).trim() || 'inherit'
      const isDark = resolvedTheme === 'dark'
      const pageBg = get('--background')
      const bg = isDark
        ? `color-mix(in oklab, ${get('--input')} 30%, ${pageBg})`
        : '#fff'
      const fg = isDark ? get('--foreground') : get('--popover-foreground')
      const muted = get('--muted')
      const border = get('--border')
      const accent = get('--editor-accent')
      const accentFg = get('--editor-accent-foreground')
      const ring = get('--editor-ring')
      const radius = get('--radius')
      const fontMono = get('--font-mono') || 'monospace'
      const mutedFg = get('--muted-foreground')
      const primary = get('--editor-primary')
      const secondary = get('--secondary')
      const accentColor = get('--editor-accent')
      const ringColor = get('--editor-ring')
      const lineHeightPx = fontSize * LINE_HEIGHT_RATIO
      const contentBufferPx = BUFFER_LINES * lineHeightPx
      const tokenRules = buildStrudelTokenColorRules(['#strudel-repl-container', '.strudel-share-preview'], {
        isDark,
        fg,
        mutedFg,
        primary,
        accent: accentColor,
        secondary,
        ring: ringColor,
      })
      const selectionBg = isDark
        ? `color-mix(in oklab, ${accent} 18%, transparent)`
        : `color-mix(in oklab, ${primary} 25%, transparent)`
      const noteHighlightColor = accentFg
      const noteHighlightBg = isDark
        ? `color-mix(in oklab, ${accentFg} 22%, transparent)`
        : `color-mix(in oklab, ${accentFg} 14%, transparent)`
      const id = 'strudel-app-theme'
      let styleEl = document.getElementById(id) as HTMLStyleElement | null
      if (!styleEl) {
        styleEl = document.createElement('style')
        styleEl.id = id
      }
      styleEl.textContent = `
#strudel-repl-container{height:100%;background:${bg} !important;}
#strudel-repl-container .cm-editor,#strudel-repl-container .cm-scroller,#strudel-repl-container .cm-content,#strudel-repl-container .cm-line{font-family:${fontMono};font-weight:500;font-size:${fontSize}px;}
#strudel-repl-container .cm-editor{background-color:${bg} !important;color:${fg} !important;border-radius:${radius};height:100%;}
#strudel-repl-container .cm-scroller{background-color:${bg} !important;}
#strudel-repl-container .cm-scroller:not(.is-scrolling):not(:hover){scrollbar-width:none;-ms-overflow-style:none;}
#strudel-repl-container .cm-scroller:not(.is-scrolling):not(:hover)::-webkit-scrollbar{display:none;}
#strudel-repl-container .cm-scroller.is-scrolling,#strudel-repl-container .cm-scroller:hover{scrollbar-width:thin;scrollbar-color:color-mix(in oklab, ${mutedFg} 35%, transparent) transparent;}
#strudel-repl-container .cm-scroller.is-scrolling::-webkit-scrollbar,#strudel-repl-container .cm-scroller:hover::-webkit-scrollbar{width:6px;height:6px;}
#strudel-repl-container .cm-scroller.is-scrolling::-webkit-scrollbar-thumb,#strudel-repl-container .cm-scroller:hover::-webkit-scrollbar-thumb{background-color:color-mix(in oklab, ${mutedFg} 35%, transparent);border-radius:9999px;}
#strudel-repl-container .cm-content{box-sizing:border-box;color:${fg} !important;min-height:100%;padding-bottom:${contentBufferPx}px !important;}
#strudel-repl-container .cm-gutters{background-color:${isDark ? muted : bg} !important;border-color:${border};min-height:100%;}
#strudel-repl-container .cm-gutterElement{min-width:3ch;text-align:right;}
#strudel-repl-container .cm-activeLineGutter{background-color:color-mix(in oklab, ${accent} 35%, transparent) !important;color:${isDark ? accentFg : fg} !important;}
#strudel-repl-container .cm-activeLine{background-color:${isDark ? muted : bg} !important;}
#strudel-repl-container .cm-selectionMatch,#strudel-repl-container .cm-selectionBackground{background-color:${selectionBg} !important;}
#strudel-repl-container .cm-content span[style*="outline"]{outline:1px solid ${noteHighlightColor} !important;background-color:${noteHighlightBg} !important;border-radius:2px;}
#strudel-repl-container .cm-editor.cm-focused{outline-color:${ring};}
#strudel-repl-container .cm-cursor{border-left-color:${fg};}
#strudel-repl-container .cm-editor .cm-flash{background-color:color-mix(in oklab, ${primary} 20%, transparent) !important;outline:1px solid color-mix(in oklab, ${primary} 55%, transparent);border-radius:2px;}
.strudel-share-preview .cm-content span[style*="outline"]{outline:1px solid ${noteHighlightColor} !important;background-color:${noteHighlightBg} !important;border-radius:2px;}
.strudel-share-preview .cm-editor,.strudel-share-preview .cm-scroller,.strudel-share-preview .cm-content,.strudel-share-preview .cm-line{font-family:${fontMono};font-weight:500;font-size:11px;}
.strudel-share-preview .cm-editor{background-color:transparent !important;color:${fg} !important;height:100%;}
.strudel-share-preview .cm-scroller{background-color:transparent !important;overflow:auto !important;}
.strudel-share-preview .cm-content{color:${fg} !important;padding:12px;}
.strudel-share-preview .cm-gutters{display:none !important;}
.strudel-share-preview .cm-activeLine{background:transparent !important;}
.strudel-share-preview .cm-editor.cm-focused{outline:none;}
.strudel-share-preview .cm-cursor{border-left-color:${fg};}
${tokenRules}
`
      document.head.appendChild(styleEl)
      setIsEditorInitialized(true)
    }
    const raf = window.requestAnimationFrame(() => apply())
    const late = window.setTimeout(() => apply(), 300)
    return () => {
      window.cancelAnimationFrame(raf)
      window.clearTimeout(late)
    }
  }, [isEditorReady, resolvedTheme, fontSize])

  useEffect(() => {
    return () => {
      document.getElementById('strudel-app-theme')?.remove()
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
    const repl = replRef.current
    if (!repl?.editor) return
    if (!effectiveCode) {
      isApplyingExternalCodeRef.current = true
      setStrudelEditorCode(repl, '', { resetHistory: true })
      isApplyingExternalCodeRef.current = false
      repl.editor?.stop?.()
      setIsPlaying(false)
      setReplError(null)
      lastSetNormalizedCodeRef.current = ''
      lastEvaluatedCodeRef.current = ''
      lastSavedCodeRef.current = ''
      setHasUnsavedChanges(false)
      setHasEditorCode(false)
      return
    }
    const normalizedCode = normalizeStrudelCode(effectiveCode)
    const domCode = normalizeStrudelCode(getStrudelEditorCode(repl))
    const codeChanged = normalizedCode !== lastSetNormalizedCodeRef.current
    const editorMissingCode = Boolean(normalizedCode.trim()) && !domCode.trim()

    if (codeChanged || editorMissingCode) {
      if (domCode === normalizedCode) {
        lastSetNormalizedCodeRef.current = normalizedCode
        currentEditorCodeRef.current = normalizedCode
        if (chatId) {
          lastSavedCodeRef.current = normalizedCode
          setHasUnsavedChanges(false)
        } else {
          setHasUnsavedChanges(Boolean(normalizedCode.trim()))
        }
        setHasEditorCode(Boolean(normalizedCode.trim()))
      } else {
        const previousCode = lastSetNormalizedCodeRef.current
        isApplyingExternalCodeRef.current = true
        if (previousCode && previousCode !== normalizedCode && !editorMissingCode && isCodeStreaming) {
          updateStrudelEditorCode(repl, normalizedCode, previousCode)
        } else {
          setStrudelEditorCode(repl, normalizedCode)
        }
        isApplyingExternalCodeRef.current = false
        lastSetNormalizedCodeRef.current = normalizedCode
        currentEditorCodeRef.current = normalizedCode
        if (chatId) {
          lastSavedCodeRef.current = normalizedCode
          setHasUnsavedChanges(false)
        } else {
          setHasUnsavedChanges(Boolean(normalizedCode.trim()))
        }
        setHasEditorCode(Boolean(normalizedCode.trim()))
      }
    }

    if (isCodeStreaming) return

    if (!codeChanged && normalizedCode === lastEvaluatedCodeRef.current) return

    setReplError(null)
    lastEvaluatedCodeRef.current = normalizedCode
    window.requestAnimationFrame(() => {
      if (!normalizedCode.trim()) return
      if (!repl.editor) return
      void evaluateStrudelEditor(repl, false).catch((error) => {
        const message = error instanceof Error ? error.message : String(error)
        if (!message.toLowerCase().includes('no code to evaluate')) {
          console.error('Failed to evaluate Strudel code:', error)
        }
      })
    })
  }, [effectiveCode, isEditorReady, isCodeStreaming, chatId])

  useEffect(() => {
    const repl = replRef.current
    if (!repl) return
    setStrudelEditorCode(repl, '', { resetHistory: true })
    repl.editor?.stop?.()
    setIsPlaying(false)
    setReplError(null)
    lastSetNormalizedCodeRef.current = ''
    lastEvaluatedCodeRef.current = ''
    lastSavedCodeRef.current = ''
    setHasUnsavedChanges(false)
    setHasEditorCode(false)
  }, [resetKey])

  useEffect(() => {
    setReplError(null)
  }, [activeSnippet?.code])

  useEffect(() => {
    const repl = replRef.current
    if (!repl) return
    const handleUpdate = (event: Event) => {
      const detail = (event as CustomEvent).detail as { error?: unknown; code?: string } | undefined
      const error = detail?.error
      if (!error) {
        lastErrorKeyRef.current = null
        replErrorRef.current = null
        setReplError(null)
        return
      }
      const code = detail?.code ?? ''
      if (code) currentEditorCodeRef.current = code
      if (lastSetNormalizedCodeRef.current && code && code !== lastSetNormalizedCodeRef.current) {
        return
      }
      const message = error instanceof Error ? error.message : String(error)
      const range = getErrorRange(error, code) ?? undefined
      const errorKey = `${message}:${range ? `${range.from}-${range.to}` : 'none'}`
      repl.editor?.stop?.()
      setIsPlaying(false)
      const nextError = { message, range }
      replErrorRef.current = nextError
      setReplError(nextError)
      if (errorKey !== lastErrorKeyRef.current) {
        lastErrorKeyRef.current = errorKey
        if (range) {
          repl.editor?.setCursorLocation?.(range.from)
          repl.editor?.flash?.(60000, range)
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
      lastEvaluatedCodeRef.current = (await playStrudelEditor(repl, lastEvaluatedCodeRef.current)) ?? lastEvaluatedCodeRef.current
      setIsPlaying(true)
    } catch (error) {
      console.error('Failed to start Strudel playback:', error)
    }
  }

  const getCurrentEditorCode = () => {
    const repl = replRef.current
    if (repl?.editor) {
      const fromEditor = getStrudelEditorCode(repl)
      if (fromEditor.trim()) return fromEditor
    }
    return currentEditorCodeRef.current || effectiveCode || ''
  }

  const handleSaveCode = async (force = false, codeOverride?: string): Promise<boolean> => {
    if (!force && !hasUnsavedChangesRef.current) return false

    const repl = replRef.current
    const rawCode = codeOverride ?? getCurrentEditorCode()
    const normalizedCode = normalizeStrudelCode(rawCode)
    if (!normalizedCode) return false

    if (codeOverride && repl?.editor) {
      isApplyingExternalCodeRef.current = true
      setStrudelEditorCode(repl, normalizedCode)
      isApplyingExternalCodeRef.current = false
      lastSetNormalizedCodeRef.current = normalizedCode
      currentEditorCodeRef.current = normalizedCode
      setHasEditorCode(Boolean(normalizedCode.trim()))
    }

    const alreadySavedLocally = normalizedCode === normalizeStrudelCode(lastSavedCodeRef.current)
    if (!force && alreadySavedLocally) return false
    if (force && chatId && alreadySavedLocally) return false

    if (liveEvaluationTimeoutRef.current !== null) {
      window.clearTimeout(liveEvaluationTimeoutRef.current)
      liveEvaluationTimeoutRef.current = null
    }
    if (isPlayingRef.current) {
      try {
        await evaluateStrudelEditor(repl, false)
      } catch {
        // Syntax errors are surfaced via the repl update event.
      }
      lastEvaluatedCodeRef.current = normalizedCode
    } else {
      try {
        await evaluateStrudelEditor(repl, false)
      } catch {
        // Syntax errors are surfaced via the repl update event.
      }
    }

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })

    if (replErrorRef.current) {
      return false
    }

    if (!chatId) {
      if (!onEnsureChat) {
        throw new Error('Sign in to save your code to a new chat')
      }
      await onEnsureChat(normalizedCode)
      currentEditorCodeRef.current = normalizedCode
      lastSavedCodeRef.current = normalizedCode
      setHasUnsavedChanges(false)
      onCodeSaved?.(normalizedCode)
      return true
    }

    await updateChat({
      id: chatId as Id<'chats'>,
      snippets: [{ ...(activeSnippet ?? {}), code: normalizedCode }],
      sessionId: anonymousSessionId ?? undefined,
    })
    currentEditorCodeRef.current = normalizedCode
    lastSavedCodeRef.current = normalizedCode
    setHasUnsavedChanges(false)
    onCodeSaved?.(normalizedCode)
    return true
  }

  handleSaveCodeRef.current = handleSaveCode

  const applyCodeToEditor = (code: string) => {
    const repl = replRef.current
    if (!repl?.editor) return false
    const normalizedCode = normalizeStrudelCode(code)
    if (!normalizedCode.trim()) return false
    isApplyingExternalCodeRef.current = true
    setStrudelEditorCode(repl, normalizedCode)
    isApplyingExternalCodeRef.current = false
    lastSetNormalizedCodeRef.current = normalizedCode
    currentEditorCodeRef.current = normalizedCode
    lastSavedCodeRef.current = normalizedCode
    setHasEditorCode(true)
    setHasUnsavedChanges(false)
    return true
  }

  applyCodeRef.current = (code: string) => {
    if (applyCodeToEditor(code)) return

    let attempts = 0
    const retry = () => {
      attempts += 1
      if (applyCodeToEditor(code) || attempts > 60) return
      window.requestAnimationFrame(retry)
    }
    window.requestAnimationFrame(retry)
  }

  const handleEditorKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!hasUnsavedChanges || replError) return
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      event.preventDefault()
      saveButtonRef.current?.run()
    }
  }

  const handleCopy = async () => {
    const code = getCurrentEditorCode()
    if (!code.trim()) return
    try {
      await navigator.clipboard.writeText(code)
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

  const handleToggleSharePlayback = async () => {
    const editor = sharePreviewRef.current?.editor
    if (!editor) return
    if (isSharePlayingRef.current) {
      editor.stop?.()
      isSharePlayingRef.current = false
      setIsSharePlaying(false)
      return
    }
    try {
      await playStrudelEditor(sharePreviewRef.current)
      isSharePlayingRef.current = true
      setIsSharePlaying(true)
    } catch (error) {
      console.error('Failed to play shared Strudel preview:', error)
    }
  }

  const openSharePreview = () => {
    currentEditorCodeRef.current = getCurrentEditorCode()
    setIsShareOpen(true)
  }

  const handleAddSelectionToContext = () => {
    const selection = selectionUI?.selection ?? getStrudelEditorSelection(replRef.current)
    if (selection) {
      onAddSelectionToContextRef.current?.(selection)
    }
  }

  const handleShare = async () => {
    if (!activeSnippet?.code || !chatId) return
    try {
      const currentCode = getCurrentEditorCode()
      currentEditorCodeRef.current = currentCode
      await makeShareable({
        id: chatId as Id<'chats'>,
        code: currentCode,
        sessionId: anonymousSessionId ?? undefined,
      })
      const shareUrl = new URL('/generate/share', window.location.origin)
      shareUrl.searchParams.set('chatId', chatId)
      shareUrl.searchParams.set('title', shareTitle || activeSnippet.title || 'Shared Stroop')
      const shareData = { title: shareTitle || activeSnippet.title || 'Stroop output', url: shareUrl.toString() }
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(shareUrl.toString())
        setHasShared(true)
        window.setTimeout(() => setHasShared(false), 1500)
      }
    } catch (error) {
      if ((error as DOMException).name !== 'AbortError') {
        console.error('Failed to share Strudel output:', error)
      }
    }
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden border-border bg-white shadow-md dark:bg-input/30 dark:shadow-xs">
      <CardContent className="flex-1 min-h-0 flex flex-col bg-white p-0 dark:bg-transparent">
        <div
          ref={editorContainerRef}
          className="strudel-main-editor relative flex-1 min-h-0"
          data-editor-initialized={isEditorInitialized}
          onKeyDownCapture={handleEditorKeyDown}
        >
          {createElement('strudel-editor', { ref: replRef, className: 'w-full flex-none h-0 min-h-0 overflow-hidden' })}
          {saveButtonVisible ? (
            <LoadingButton
              ref={saveButtonRef}
              className="absolute top-4 right-4 z-10 h-7 rounded-full px-2"
              leading={
                <KbdGroup>
                  <Kbd className="h-4 min-w-4 px-0.5 text-[10px]">⌘</Kbd>
                  <span className="text-[10px] text-muted-foreground">+</span>
                  <Kbd className="h-4 min-w-4 px-0.5 text-[10px]">S</Kbd>
                </KbdGroup>
              }
              onAction={handleSaveCode}
              pendingLabel="Saving…"
              successLabel="Saved"
              errorLabel="Retry"
              resetAfter={1000}
              disabled={isCodeStreaming || !hasUnsavedChanges || Boolean(replError)}
              onError={(error) => console.error('Failed to save Strudel code:', error)}
              onReset={() => {
                if (!hasUnsavedChangesRef.current) setSaveButtonVisible(false)
              }}
            >
              Save
            </LoadingButton>
          ) : null}
          {selectionUI && onAddSelectionToContext && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="absolute z-20 h-7 cursor-pointer gap-1 rounded-md bg-background px-2 text-xs shadow-md hover:bg-muted hover:text-foreground"
              style={{
                top: selectionUI.anchor.top - 8,
                left: selectionUI.anchor.left - 24,
                transform: 'translate(-100%, -100%)',
              }}
              onMouseDown={(event) => event.preventDefault()}
              onClick={handleAddSelectionToContext}
            >
              <MessageSquare className="h-3 w-3" />
              Edit in chat
            </Button>
          )}
          {isLoading ? (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-background/60 text-sm text-muted-foreground">
              Waiting for code...
            </div>
          ) : null}
          {replError ? (
            <div className="absolute top-16 right-4 z-10 max-w-xs">
              <Alert variant="destructive" className="py-2 px-3 bg-background">
                <AlertTitle className="text-xs font-bold">Strudel syntax error</AlertTitle>
                <AlertDescription className="text-xs break-all line-clamp-3">{replError.message}</AlertDescription>
                {onFixInChat && hasEditorCode && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 h-6 text-xs gap-1"
                    onClick={() => onFixInChat(replError.message, getCurrentEditorCode())}
                  >
                    <MessageSquare className="h-3 w-3" />
                    Fix in chat
                  </Button>
                )}
              </Alert>
            </div>
          ) : null}
          <div className="absolute inset-x-4 bottom-4 z-10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-full bg-background" onClick={handleCopy} aria-label="Copy code" disabled={!hasEditorCode}>
                {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-full bg-background" onClick={openSharePreview} aria-label="Share output" disabled={!hasEditorCode}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
            <MorphButton
              active={isPlaying}
              onToggle={() => void handleTogglePlayback()}
              disabled={!hasEditorCode || !isEditorReady || Boolean(replError) || isCodeStreaming}
              className="h-11 shrink-0 px-5"
            />
            <div className="flex items-center gap-1 rounded-full border bg-background p-0.5">
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => setFontSize((s) => Math.max(10, s - 1))} aria-label="Decrease font size">
                <Minus className="h-3 w-3" />
              </Button>
              <span className="text-xs tabular-nums w-6 text-center select-none">{fontSize}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => setFontSize((s) => Math.min(24, s + 1))} aria-label="Increase font size">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="max-w-lg rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-outfit">Share your Stroop</DialogTitle>
            <DialogDescription>Send this playable output to someone else.</DialogDescription>
          </DialogHeader>
          <div className="overflow-hidden rounded-lg border border-l-2 border-l-primary/40 bg-card px-5 pb-4 pt-4">
            <div className="mb-2 flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-2">
                <p className="line-clamp-1 font-outfit text-base font-semibold">{activeSnippet?.title || shareTitle || 'Shared Stroop'}</p>
                <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {activeSnippet?.title && shareTitle ? shareTitle : 'A generated Strudel pattern made with Stroop.'}
                </p>
              </div>
              <MorphButton
                active={isSharePlaying}
                onToggle={() => void handleToggleSharePlayback()}
                disabled={!isSharePreviewReady}
                showLabel={false}
                iconSize={14}
                variant="outline"
                size="icon"
                className={cn(
                  'h-9 w-9 shrink-0',
                  isSharePlaying && 'bg-primary text-primary-foreground hover:bg-primary/90',
                )}
              />
            </div>
            <div className="strudel-share-preview mt-3 overflow-hidden rounded-md bg-muted/60">
              <div className="flex items-center gap-1.5 border-b border-border/40 px-3 py-1.5">
                <span className="h-2 w-2 rounded-full bg-red-400/60" />
                <span className="h-2 w-2 rounded-full bg-yellow-400/60" />
                <span className="h-2 w-2 rounded-full bg-green-400/60" />
                <span className="ml-2 font-mono text-[10px] text-muted-foreground/60">strudel</span>
              </div>
              <div className="h-40 overflow-auto">
                {isShareOpen && createElement('strudel-editor', { ref: sharePreviewRef, className: 'h-0 w-full overflow-hidden' })}
              </div>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Making this chat shareable will share the generated Strudel code. Your conversation stays private.
          </p>
          <Button className="w-full rounded-full" onClick={handleShare} disabled={!chatId}>
            {hasShared ? <Check /> : <Share2 />}
            {hasShared ? 'Link copied' : 'Share output'}
          </Button>
          {!chatId && <p className="text-center text-xs text-muted-foreground">Save this chat before sharing it.</p>}
        </DialogContent>
      </Dialog>
    </Card>
  )
})

export default StrudelCodeViewer
