import { Transaction } from '@codemirror/state'
import { isolateHistory } from '@codemirror/commands'

type EditorViewLike = {
  state: { doc: { length: number } }
  dispatch: (spec: {
    changes: { from: number; to: number; insert: string }
    annotations: unknown[]
  }) => void
}

type StrudelMirrorInstance = {
  setCode?: (code: string) => void
  editor?: EditorViewLike
}

type StrudelEditorElement = HTMLElement & {
  editor?: StrudelMirrorInstance
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
