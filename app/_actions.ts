'use server'

import { GenerateStrudelRequest, GenerateStrudelResponse } from '@/types/types'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { redirect } from 'next/navigation'
import { GITHUB_LINK } from '@/lib/utils'
import { revalidatePath } from 'next/cache'
import { parseStrudelSnippets, StrudelSnippetsSchema } from '@/lib/strudel-generation'

const MOCK = false

export const generateStrudelSnippets = async (
  userInput: GenerateStrudelRequest,
): Promise<GenerateStrudelResponse> => {
  if (MOCK) return { snippets: [] }

  try {
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: StrudelSnippetsSchema,
      prompt: `Generate 1 Strudel code snippet based on the user's request. The snippet should be valid Strudel code and playable as-is.\n\nUser request: ${userInput.prompt}`,
    })

    if (!object || !object.snippets) {
      return { error: 'Error while generating Strudel snippets.' }
    }

    const snippets = parseStrudelSnippets(object)

    return { snippets }
  } catch (error: any) {
    return { error: error.message || 'Error while generating Strudel snippets.' }
  }
}

export const navigateToGithub = async () => {
  redirect(GITHUB_LINK)
}

export const reGenerate = async () => {
  revalidatePath('/')
}
