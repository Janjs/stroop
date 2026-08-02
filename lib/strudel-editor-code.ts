import { Transaction } from '@codemirror/state'
import { isolateHistory } from '@codemirror/commands'
import type { EditorSelectionContext } from '@/types/types'

type EditorViewLike = {
  state: {
    doc: { length: number; sliceString?: (from: number, to: number) => string }
    selection: { main: { from: number; to: number; empty: boolean } }
  }
  coordsAtPos?: (
    pos: number,
    side?: -1 | 1,
  ) => { left: number; right: number; top: number; bottom: number } | null
  scrollDOM?: HTMLElement
  dispatch: (spec: {
    changes: { from: number; to: number; insert: string }
    annotations?: unknown[]
  }) => void
}

export type SelectionAnchor = {
  top: number
  left: number
}

export type EditorSelectionUI = {
  selection: EditorSelectionContext
  anchor: SelectionAnchor
}

function getEditorSurface(container: HTMLElement): HTMLElement | null {
  return (
    container.querySelector('#strudel-repl-container') ??
    container.querySelector('.cm-editor')?.closest('.cm-editor')?.parentElement ??
    container.querySelector('.cm-scroller')?.parentElement ??
    null
  )
}

function getAnchorFromCoords(
  repl: StrudelEditorElement | null | undefined,
  container: HTMLElement,
  selection: EditorSelectionContext,
): SelectionAnchor | null {
  const view = repl?.editor?.editor
  if (!view?.coordsAtPos) return null

  const scroller = view.scrollDOM ?? container.querySelector('.cm-scroller')
  if (!(scroller instanceof HTMLElement)) return null

  const startCoords = view.coordsAtPos(selection.from, -1)
  const endCoords = view.coordsAtPos(selection.to, 1)
  if (!startCoords || !endCoords) return null

  const selectionTop = Math.min(startCoords.top, endCoords.top)
  const selectionRight = Math.max(startCoords.right, endCoords.right)
  const scrollerRect = scroller.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()

  return {
    top: selectionTop - scroller.scrollTop + (scrollerRect.top - containerRect.top),
    left: selectionRight - scroller.scrollLeft + (scrollerRect.left - containerRect.left),
  }
}

export function getStrudelEditorSelectionUI(
  repl: StrudelEditorElement | null | undefined,
  container: HTMLElement | null,
): EditorSelectionUI | null {
  if (!container) return null

  const editorEl = container.querySelector('.cm-editor')
  const nativeSelection = window.getSelection()
  if (
    editorEl &&
    nativeSelection &&
    !nativeSelection.isCollapsed &&
    nativeSelection.rangeCount > 0
  ) {
    const range = nativeSelection.getRangeAt(0)
    if (editorEl.contains(range.commonAncestorContainer)) {
      const text = nativeSelection.toString()
      if (text.trim()) {
        const rect = range.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()
        const cmSelection = getStrudelEditorSelection(repl)

        return {
          selection: cmSelection ?? { from: 0, to: text.length, text },
          anchor: {
            top: rect.top - containerRect.top,
            left: rect.right - containerRect.left,
          },
        }
      }
    }
  }

  const cmSelection = getStrudelEditorSelection(repl)
  if (!cmSelection) return null

  const anchor = getAnchorFromCoords(repl, container, cmSelection)
  if (!anchor) return null

  return { selection: cmSelection, anchor }
}

type StrudelMirrorInstance = {
  code?: string
  setCode?: (code: string) => void
  evaluate?: (autostart?: boolean) => void | Promise<unknown>
  stop?: () => void
  flash?: (ms?: number, range?: { from: number; to: number }) => void
  setCursorLocation?: (col: number) => void
  changeSetting?: (key: string, value: boolean) => void
  editor?: EditorViewLike
  repl?: {
    evaluate?: (code: string, autostart?: boolean) => void | Promise<unknown>
    start?: () => void
  }
}

export type StrudelEditorElement = HTMLElement & {
  editor?: StrudelMirrorInstance
}

export function getStrudelEditorCode(repl: StrudelEditorElement | null | undefined): string {
  const mirror = repl?.editor
  if (!mirror) return ''
  if (mirror.code) return mirror.code
  const view = mirror.editor
  if (!view) return ''
  const doc = view.state.doc
  if (typeof doc.sliceString === 'function') {
    return doc.sliceString(0, doc.length)
  }
  return ''
}

export function getStrudelEditorSelection(
  repl: StrudelEditorElement | null | undefined,
): EditorSelectionContext | null {
  const mirror = repl?.editor
  const view = mirror?.editor
  if (!view) return null

  const { from, to, empty } = view.state.selection.main
  if (empty || from === to) return null

  const text =
    (typeof view.state.doc.sliceString === 'function'
      ? view.state.doc.sliceString(from, to)
      : (mirror?.code ?? '').slice(from, to)) || ''

  if (!text.trim()) return null
  return { from, to, text }
}

export function getStrudelEditorSelectionAnchor(
  repl: StrudelEditorElement | null | undefined,
  container: HTMLElement | null,
): SelectionAnchor | null {
  return getStrudelEditorSelectionUI(repl, container)?.anchor ?? null
}

export function subscribeStrudelEditorSelection(
  repl: StrudelEditorElement | null | undefined,
  container: HTMLElement | null,
  onSelectionChange: (selectionUI: EditorSelectionUI | null) => void,
) {
  if (!container) return () => {}

  let frameId = 0
  const notify = () => {
    window.cancelAnimationFrame(frameId)
    frameId = window.requestAnimationFrame(() => {
      frameId = window.requestAnimationFrame(() => {
        onSelectionChange(getStrudelEditorSelectionUI(repl, container))
      })
    })
  }

  const editorSurface = getEditorSurface(container)
  const targets = [container, editorSurface].filter(Boolean) as HTMLElement[]

  for (const target of targets) {
    target.addEventListener('pointerup', notify)
    target.addEventListener('keyup', notify)
  }
  document.addEventListener('selectionchange', notify)

  const scroller = container.querySelector('.cm-scroller')
  scroller?.addEventListener('scroll', notify, { passive: true })
  window.addEventListener('resize', notify)

  return () => {
    window.cancelAnimationFrame(frameId)
    for (const target of targets) {
      target.removeEventListener('pointerup', notify)
      target.removeEventListener('keyup', notify)
    }
    document.removeEventListener('selectionchange', notify)
    scroller?.removeEventListener('scroll', notify)
    window.removeEventListener('resize', notify)
  }
}

export function setStrudelEditorCode(
  repl: StrudelEditorElement | null | undefined,
  code: string,
  options?: { resetHistory?: boolean },
) {
  const mirror = repl?.editor
  if (!mirror) return

  if (options?.resetHistory && mirror.editor) {
    mirror.editor.dispatch({
      changes: { from: 0, to: mirror.editor.state.doc.length, insert: code },
      annotations: [Transaction.addToHistory.of(false), isolateHistory.of('full')],
    })
    return
  }

  mirror.setCode?.(code)
}

export function updateStrudelEditorCode(
  repl: StrudelEditorElement | null | undefined,
  newCode: string,
  previousCode?: string,
) {
  const mirror = repl?.editor
  if (!mirror) return

  const view = mirror.editor
  const currentCode = getStrudelEditorCode(repl) || previousCode || ''

  if (currentCode === newCode) return

  if (!view) {
    mirror.setCode?.(newCode)
    return
  }

  if (newCode.startsWith(currentCode)) {
    const insert = newCode.slice(currentCode.length)
    if (insert) {
      view.dispatch({
        changes: { from: currentCode.length, to: currentCode.length, insert },
      })
    }
    return
  }

  let prefixLen = 0
  const minLen = Math.min(currentCode.length, newCode.length)
  while (prefixLen < minLen && currentCode[prefixLen] === newCode[prefixLen]) {
    prefixLen += 1
  }

  let suffixLen = 0
  while (
    suffixLen < minLen - prefixLen &&
    currentCode[currentCode.length - 1 - suffixLen] === newCode[newCode.length - 1 - suffixLen]
  ) {
    suffixLen += 1
  }

  const from = prefixLen
  const to = currentCode.length - suffixLen
  const insert = newCode.slice(prefixLen, newCode.length - suffixLen)

  view.dispatch({
    changes: { from, to, insert },
  })
}

export function configureStrudelEditor(repl: StrudelEditorElement | null | undefined) {
  repl?.editor?.changeSetting?.('isFlashEnabled', false)
}

export async function evaluateStrudelEditor(
  repl: StrudelEditorElement | null | undefined,
  autostart = false,
) {
  const mirror = repl?.editor
  if (!mirror) return
  return mirror.evaluate?.(autostart)
}

export async function playStrudelEditor(
  repl: StrudelEditorElement | null | undefined,
  lastEvaluatedCode?: string,
) {
  const mirror = repl?.editor
  if (!mirror) return lastEvaluatedCode

  const currentCode = getStrudelEditorCode(repl) || mirror.code || ''
  const isResume = lastEvaluatedCode !== undefined && currentCode === lastEvaluatedCode

  if (isResume) {
    await mirror.evaluate?.(false)
    mirror.repl?.start?.()
    return lastEvaluatedCode
  }

  await evaluateStrudelEditor(repl, true)
  return currentCode
}
