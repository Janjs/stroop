export const PROVISIONAL_TITLE_WORDS = 4

export function chatTitleFromPrompt(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean)
  return words.slice(0, PROVISIONAL_TITLE_WORDS).join(' ') || 'New Chat'
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
