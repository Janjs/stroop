export type PendingAudioPayload = {
  text: string
  files: { type: 'file'; mediaType: string; url: string; filename?: string }[]
}

let pending: PendingAudioPayload | null = null

export function stashPendingAudio(payload: PendingAudioPayload) {
  pending = payload
}

export function takePendingAudio(): PendingAudioPayload | null {
  const value = pending
  pending = null
  return value
}
