export const DEFAULT_CHAT_TITLE = 'New chat'

export const PROVISIONAL_TITLE_WORDS = 4

export function chatTitleFromPrompt(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean)
  return words.slice(0, PROVISIONAL_TITLE_WORDS).join(' ') || DEFAULT_CHAT_TITLE
}

export async function generateChatTitle(prompt: string): Promise<string> {
  try {
    const response = await fetch('/api/chat/title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
    const data = await response.json()
    return data.title || chatTitleFromPrompt(prompt)
  } catch {
    return chatTitleFromPrompt(prompt)
  }
}

export function codeTitleInput(code: string): string {
  const lines = code
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('//') && !line.startsWith('/*'))
  return lines.slice(0, 4).join(' ').slice(0, 200) || 'Manual Strudel pattern'
}

export async function generateChatTitleFromCode(code: string): Promise<string> {
  const input = codeTitleInput(code)
  try {
    const response = await fetch('/api/chat/title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: input }),
    })
    const data = await response.json()
    return data.title || chatTitleFromPrompt(input)
  } catch {
    return chatTitleFromPrompt(input)
  }
}
