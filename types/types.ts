export type StrudelSnippet = {
  title?: string
  code: string
}

export interface GenerateStrudelRequest {
  prompt: string
}

export interface GenerateStrudelResponse {
  error?: string
  snippets?: StrudelSnippet[]
}
