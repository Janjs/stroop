import { Transaction } from '@codemirror/state'
import { isolateHistory } from '@codemirror/commands'

type EditorViewLike = {
  state: {
    doc: { length: number }
    selection: { main: { from: number; to: number; empty: boolean } }
    sliceDoc: (from: number, to: number) => string
  }
  dispatch: (spec: {
    changes: { from: number; to: number; insert: string }
    annotations?: unknown[]
  }) => void
  coordsAtPos?: (pos: number) => { top: number; left: number; bottom: number; right: number } | null
  focus?: () => void
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

export type StrudelSelection = {
  from: number
  to: number
  text: string
}

export function getStrudelEditorView(repl: StrudelEditorElement | null | undefined) {
  return repl?.editor?.editor ?? null
}

export function getStrudelEditorCode(repl: StrudelEditorElement | null | undefined) {
  return repl?.editor?.code ?? ''
}

export function getStrudelSelection(repl: StrudelEditorElement | null | undefined): StrudelSelection | null {
  const view = getStrudelEditorView(repl)
  if (!view) return null
  const { from, to, empty } = view.state.selection.main
  if (empty || from === to) return null
  return { from, to, text: view.state.sliceDoc(from, to) }
}

export function replaceStrudelRange(
  repl: StrudelEditorElement | null | undefined,
  from: number,
  to: number,
  insert: string,
) {
  const view = getStrudelEditorView(repl)
  if (!view) return
  view.dispatch({
    changes: { from, to, insert },
  })
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

  const currentCode = mirror.code ?? ''
  if (
    lastEvaluatedCode !== undefined &&
    currentCode === lastEvaluatedCode &&
    mirror.repl?.start
  ) {
    mirror.repl.start()
    return lastEvaluatedCode
  }

  await evaluateStrudelEditor(repl, true)
  return currentCode
}
