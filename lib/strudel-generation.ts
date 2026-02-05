import { z } from 'zod'
import { StrudelSnippet } from '@/types/types'

export const StrudelSnippetsSchema = z.object({
  snippets: z.array(
    z.object({
      title: z.string().min(1),
      code: z.string().min(1),
    })
  ).length(1).describe('1 strudel code snippet with a title'),
})

export const parseStrudelSnippets = (data: z.infer<typeof StrudelSnippetsSchema>): StrudelSnippet[] => {
  return data.snippets.map((snippet, index) => ({
    title: snippet.title ?? `Pattern ${index + 1}`,
    code: snippet.code.trim(),
  }))
}
