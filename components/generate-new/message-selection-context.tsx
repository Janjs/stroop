import { EditorSelectionContext } from '@/types/types'

type MessageSelectionContextProps = {
  selection: EditorSelectionContext
}

export function MessageSelectionContext({ selection }: MessageSelectionContextProps) {
  return (
    <div className="rounded-md border bg-background/50 px-3 py-2">
      <p className="text-xs font-medium text-muted-foreground">Selected code</p>
      <p className="mt-1 line-clamp-3 font-mono text-xs">{selection.text}</p>
    </div>
  )
}
