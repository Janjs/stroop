'use client'

import { PaperclipIcon } from 'lucide-react'
import { PromptInputButton, PromptInputTools, usePromptInputAttachments } from '@/components/ai-elements/prompt-input'
import { AudioRecorderButton } from './audio-recorder-button'

export { AudioRecorderButton } from './audio-recorder-button'
export { AudioAttachmentPreview, MessageAudioRecordings } from './audio-attachment-preview'
export { AudioRecordingStatusProvider, useAudioRecordingStatus } from './audio-recording-status'

export function AudioPromptButtons() {
  const { openFileDialog } = usePromptInputAttachments()
  return (
    <PromptInputTools className="min-w-0 flex-1">
      <PromptInputButton aria-label="Attach audio" onClick={openFileDialog}>
        <PaperclipIcon className="size-4" />
      </PromptInputButton>
      <AudioRecorderButton />
    </PromptInputTools>
  )
}
