import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

export const PROMPT_PARAM_KEY = 'prompt'

const useGenerateSearchParams = (): [
  prompt: string | null,
  setPrompt: (prompt: string) => void,
] => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const prompt = useMemo(() => {
    return searchParams.get(PROMPT_PARAM_KEY)
  }, [searchParams])

  const setPrompt = (newPrompt: string) => {
    const params = new URLSearchParams()
    params.set(PROMPT_PARAM_KEY, newPrompt)
    router.push(`/generate?${params.toString()}`)
  }

  return [prompt, setPrompt]
}

export default useGenerateSearchParams
