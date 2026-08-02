export type StrudelSnippet = {
  title?: string
  code: string
}

export type EditorSelectionContext = {
  from: number
  to: number
  text: string
}

export type EditorContext = {
  code: string
  selection?: EditorSelectionContext
}

export interface GenerateStrudelRequest {
  prompt: string
}

export interface GenerateStrudelResponse {
  error?: string
  snippets?: StrudelSnippet[]
}
