export type PendingAudioPayload = {
  text: string
  files: { type: 'file'; mediaType: string; url: string; filename?: string }[]
}

const KEY = 'stroop-pending-audio'

export function stashPendingAudio(payload: PendingAudioPayload) {
  sessionStorage.setItem(KEY, JSON.stringify(payload))
}

export function takePendingAudio(): PendingAudioPayload | null {
  const raw = sessionStorage.getItem(KEY)
  if (!raw) return null
  sessionStorage.removeItem(KEY)
  try {
    return JSON.parse(raw) as PendingAudioPayload
  } catch {
    return null
  }
}
