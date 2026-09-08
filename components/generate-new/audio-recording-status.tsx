'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

type AudioRecordingStatusContextValue = {
  processingCount: number
  beginProcessing: () => void
  endProcessing: () => void
}

const AudioRecordingStatusContext = createContext<AudioRecordingStatusContextValue | null>(null)

export function AudioRecordingStatusProvider({ children }: { children: React.ReactNode }) {
  const [processingCount, setProcessingCount] = useState(0)

  const beginProcessing = useCallback(() => {
    setProcessingCount((count) => count + 1)
  }, [])

  const endProcessing = useCallback(() => {
    setProcessingCount((count) => Math.max(0, count - 1))
  }, [])

  const value = useMemo(
    () => ({ processingCount, beginProcessing, endProcessing }),
    [processingCount, beginProcessing, endProcessing],
  )

  return (
    <AudioRecordingStatusContext.Provider value={value}>
      {children}
    </AudioRecordingStatusContext.Provider>
  )
}

export function useAudioRecordingStatus() {
  const context = useContext(AudioRecordingStatusContext)
  if (!context) {
    return {
      processingCount: 0,
      beginProcessing: () => undefined,
      endProcessing: () => undefined,
    }
  }
  return context
}
