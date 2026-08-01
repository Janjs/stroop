'use client'

import { useCallback, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, X } from 'lucide-react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@/components/ui/input-group'
import {
  evaluateStrudelEditor,
  getStrudelEditorCode,
  getStrudelSelection,
  replaceStrudelRange,
  type StrudelEditorElement,
} from '@/lib/strudel-editor-code'

type SelectionAnchor = {
  from: number
  to: number
  top: number
  left: number
}

type UseStrudelSelectionEditorOptions = {
  replRef: React.RefObject<StrudelEditorElement | null>
  isEditorReady: boolean
  onApplied?: (code: string) => void
}

const MIN_SELECTION_LENGTH = 1

export function useStrudelSelectionEditor({
  replRef,
  isEditorReady,
  onApplied,
}: UseStrudelSelectionEditorOptions) {
  const [anchor, setAnchor] = useState<SelectionAnchor | null>(null)
  const [draft, setDraft] = useState('')
  const rangeRef = useRef<{ from: number; to: number } | null>(null)

  const close = useCallback(() => {
    setAnchor(null)
    rangeRef.current = null
    setDraft('')
  }, [])

  const syncSelection = useCallback(() => {
    if (!isEditorReady) return
    const repl = replRef.current
    const selection = getStrudelSelection(repl)
    if (!selection || selection.text.length < MIN_SELECTION_LENGTH) {
      close()
      return
    }
    const view = repl?.editor?.editor
    const coords = view?.coordsAtPos?.(selection.from)
    if (!coords) return
    rangeRef.current = { from: selection.from, to: selection.to }
    setDraft(selection.text)
    setAnchor({
      from: selection.from,
      to: selection.to,
      top: coords.bottom + 6,
      left: coords.left,
    })
  }, [close, isEditorReady, replRef])

  const handlePointerUp = useCallback(() => {
    window.requestAnimationFrame(syncSelection)
  }, [syncSelection])

  const handleKeyUp = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        close()
        return
      }
      if (event.key === 'Shift' || event.key.startsWith('Arrow') || event.key === 'Meta' || event.key === 'Control') {
        window.requestAnimationFrame(syncSelection)
      }
    },
    [close, syncSelection],
  )

  const handleApply = useCallback(async () => {
    const range = rangeRef.current
    const repl = replRef.current
    if (!range || !repl) return
    replaceStrudelRange(repl, range.from, range.to, draft)
    const code = getStrudelEditorCode(repl)
    await evaluateStrudelEditor(repl, false)
    onApplied?.(code)
    close()
    repl.editor?.editor?.focus?.()
  }, [close, draft, onApplied, replRef])

  const handlePanelKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        replRef.current?.editor?.editor?.focus?.()
      }
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault()
        void handleApply()
      }
    },
    [close, handleApply, replRef],
  )

  const panel =
    anchor && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="fixed z-50 w-72 rounded-md border bg-popover p-3 text-popover-foreground shadow-md"
            style={{
              top: Math.min(anchor.top, window.innerHeight - 180),
              left: Math.min(Math.max(8, anchor.left), window.innerWidth - 296),
            }}
            onKeyDown={handlePanelKeyDown}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <p className="mb-2 text-xs text-muted-foreground">Edit selection</p>
            <InputGroup className="font-mono text-xs">
              <InputGroupTextarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={Math.min(6, Math.max(2, draft.split('\n').length))}
                autoFocus
                spellCheck={false}
              />
              <InputGroupAddon align="block-end" className="justify-end gap-1 border-t px-2 py-1.5">
                <InputGroupButton size="icon-xs" aria-label="Cancel edit" onClick={close}>
                  <X />
                </InputGroupButton>
                <InputGroupButton size="icon-xs" aria-label="Apply edit" onClick={() => void handleApply()}>
                  <Check />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>,
          document.body,
        )
      : null

  return { panel, handlePointerUp, handleKeyUp, refreshSelection: syncSelection }
}
