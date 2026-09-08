'use client'

import { cn } from '@/lib/utils'

export const WAVEFORM_BAR_COUNT = 96
export const WAVEFORM_PEAK_COUNT = 48
export const MIN_BAR_LEVEL = 0.06
const MAX_BAR_HEIGHT = 22

const waveformMaskStyle = {
  maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
  WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
} as const

export async function extractWaveformPeaks(url: string, barCount = WAVEFORM_PEAK_COUNT) {
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const audioContext = new AudioContextClass()

  try {
    const response = await fetch(url)
    const buffer = await response.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(buffer.slice(0))
    const channel = audioBuffer.getChannelData(0)
    const blockSize = Math.max(1, Math.floor(channel.length / barCount))
    const peaks: number[] = []

    for (let i = 0; i < barCount; i++) {
      const start = i * blockSize
      let max = 0
      for (let j = start; j < start + blockSize; j++) {
        max = Math.max(max, Math.abs(channel[j] ?? 0))
      }
      peaks.push(Math.max(MIN_BAR_LEVEL, Math.min(1, max * 2.2)))
    }

    return peaks
  } finally {
    await audioContext.close()
  }
}

function WaveformBars({
  levels,
  progress = 1,
  active = true,
  compact = false,
}: {
  levels: number[]
  progress?: number
  active?: boolean
  compact?: boolean
}) {
  const maxHeight = compact ? 18 : MAX_BAR_HEIGHT

  return (
    <>
      {levels.map((level, index) => {
        const barProgress = (index + 1) / levels.length
        const isPlayed = barProgress <= progress

        return (
          <span
            key={index}
            className={cn(
              'w-0.5 shrink-0 rounded-full transition-[height,background-color,opacity] duration-150',
              isPlayed ? 'bg-foreground/75' : 'bg-foreground/25',
              !active && 'bg-foreground/20',
            )}
            style={{
              height: `${Math.max(2, (active ? level : MIN_BAR_LEVEL) * maxHeight)}px`,
              opacity: active ? (isPlayed ? 0.95 : 0.45) : 0.35,
            }}
          />
        )
      })}
    </>
  )
}

export function LiveRecordingWaveform({
  levels,
  active,
  className,
}: {
  levels: number[]
  active: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative min-w-0 flex-1 overflow-hidden rounded-sm bg-background/40',
        !active && 'opacity-60',
        className,
      )}
      style={waveformMaskStyle}
    >
      <div className="flex h-7 items-center justify-end gap-0.5 overflow-hidden px-1">
        <WaveformBars levels={levels} active={active} progress={1} />
      </div>
    </div>
  )
}

export function RecordedWaveform({
  peaks,
  progress = 0,
  isPlaying = false,
  compact = false,
  className,
}: {
  peaks: number[] | null
  progress?: number
  isPlaying?: boolean
  compact?: boolean
  className?: string
}) {
  const levels =
    peaks ??
    Array.from({ length: compact ? 24 : WAVEFORM_PEAK_COUNT }, () => MIN_BAR_LEVEL)
  const displayProgress = isPlaying || (progress > 0 && progress < 1) ? progress : 1

  return (
    <div
      className={cn('relative min-w-0 flex-1 overflow-hidden rounded-sm bg-background/40', className)}
      style={waveformMaskStyle}
    >
      <div className="flex h-6 items-center justify-center gap-0.5 overflow-hidden px-1">
        <WaveformBars
          levels={levels}
          progress={displayProgress}
          active={peaks !== null}
          compact={compact}
        />
      </div>
    </div>
  )
}
