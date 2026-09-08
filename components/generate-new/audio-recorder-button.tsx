'use client'

import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react'
import { CheckIcon, ChevronDownIcon, Loader2Icon, MicIcon, SquareIcon, XIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'
import {
  usePromptInputAttachments,
  type AttachmentsContext,
} from '@/components/ai-elements/prompt-input'
import { useAudioRecordingStatus } from './audio-recording-status'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LiveRecordingWaveform, WAVEFORM_BAR_COUNT } from './audio-waveform'
import {
  audioControlSurfaceClassName,
  audioControlSurfaceHoverClassName,
} from './audio-control-surface'
import { MAX_AUDIO_SECONDS } from '@/lib/audio-spectrogram'

const MAX_RECORDING_MS = MAX_AUDIO_SECONDS * 1000
const enterTransition = { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const }

function useDelayedExpand(open: boolean) {
  const [expanded, setExpanded] = useState(open)

  useEffect(() => {
    if (open) setExpanded(true)
  }, [open])

  const onCollapseComplete = () => {
    if (!open) setExpanded(false)
  }

  return { expanded, onCollapseComplete }
}

type AudioInputDevice = {
  deviceId: string
  label: string
}

type RecorderState = 'idle' | 'recording' | 'processing' | 'success' | 'error'

function cleanDeviceLabel(label: string, index: number) {
  return label
    .replace(/\s*\([^)]*\)\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim() || `Microphone ${index + 1}`
}

function writeString(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i++) {
    view.setUint8(offset + i, value.charCodeAt(i))
  }
}

function audioBufferToWavBlob(audioBuffer: AudioBuffer) {
  const channelCount = audioBuffer.numberOfChannels
  const sampleRate = audioBuffer.sampleRate
  const samples = audioBuffer.length
  const bytesPerSample = 2
  const blockAlign = channelCount * bytesPerSample
  const dataSize = samples * blockAlign
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)
  const channels = Array.from({ length: channelCount }, (_, index) => audioBuffer.getChannelData(index))

  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, channelCount, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true)
  writeString(view, 36, 'data')
  view.setUint32(40, dataSize, true)

  let offset = 44
  for (let i = 0; i < samples; i++) {
    for (let channel = 0; channel < channelCount; channel++) {
      const sample = Math.max(-1, Math.min(1, channels[channel][i]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
      offset += bytesPerSample
    }
  }

  return new Blob([buffer], { type: 'audio/wav' })
}

async function convertRecordingToWavFile(blob: Blob) {
  const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  const audioContext = new AudioContextClass()

  try {
    const audioBuffer = await audioContext.decodeAudioData(await blob.arrayBuffer())
    const wavBlob = audioBufferToWavBlob(audioBuffer)
    return new File([wavBlob], `stroop-recording-${Date.now()}.wav`, { type: 'audio/wav' })
  } finally {
    await audioContext.close()
  }
}

function getSupportedRecorderMimeType() {
  const preferredTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
  return preferredTypes.find((type) => MediaRecorder.isTypeSupported(type))
}

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

type MicrophoneAccessFailure = 'unsupported' | 'denied' | 'not-found' | 'in-use' | 'unknown'

async function queryMicrophonePermission(): Promise<PermissionState | null> {
  if (!navigator.permissions?.query) return null
  try {
    const status = await navigator.permissions.query({ name: 'microphone' as PermissionName })
    return status.state
  } catch {
    return null
  }
}

async function requestSelectedMicrophoneAccess(deviceId: string) {
  if (!navigator.mediaDevices?.getUserMedia) {
    return { ok: false as const, reason: 'unsupported' as MicrophoneAccessFailure }
  }

  const permission = await queryMicrophonePermission()
  if (permission === 'denied') {
    return { ok: false as const, reason: 'denied' as MicrophoneAccessFailure }
  }

  const audioConstraints: MediaTrackConstraints | boolean = deviceId
    ? { deviceId: { exact: deviceId } }
    : true

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints })
    if (deviceId) {
      const activeDeviceId = stream.getAudioTracks()[0]?.getSettings().deviceId
      if (activeDeviceId && activeDeviceId !== deviceId) {
        stream.getTracks().forEach((track) => track.stop())
        return { ok: false as const, reason: 'not-found' as MicrophoneAccessFailure }
      }
    }
    return { ok: true as const, stream }
  } catch (error) {
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        return { ok: false as const, reason: 'denied' as MicrophoneAccessFailure }
      }
      if (error.name === 'NotFoundError' || error.name === 'OverconstrainedError') {
        return { ok: false as const, reason: 'not-found' as MicrophoneAccessFailure }
      }
      if (error.name === 'NotReadableError') {
        return { ok: false as const, reason: 'in-use' as MicrophoneAccessFailure }
      }
    }
    return { ok: false as const, reason: 'unknown' as MicrophoneAccessFailure }
  }
}

export type AudioRecorderButtonHandle = {
  startRecording: () => void
}

export const AudioRecorderButton = forwardRef<AudioRecorderButtonHandle>(function AudioRecorderButton(_, ref) {
  const attachments = usePromptInputAttachments()
  const { beginProcessing, endProcessing } = useAudioRecordingStatus()
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const waveformHistoryRef = useRef<number[]>(Array.from({ length: WAVEFORM_BAR_COUNT }, () => 0.06))
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const startedAtRef = useRef(0)
  const [isRecording, setIsRecording] = useState(false)
  const [isCheckingAccess, setIsCheckingAccess] = useState(false)
  const [isPreparingRecording, setIsPreparingRecording] = useState(false)
  const [feedbackState, setFeedbackState] = useState<RecorderState>('idle')
  const [elapsedMs, setElapsedMs] = useState(0)
  const [levels, setLevels] = useState<number[]>(() => Array.from({ length: WAVEFORM_BAR_COUNT }, () => 0.06))
  const [devices, setDevices] = useState<AudioInputDevice[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [isLoadingDevices, setIsLoadingDevices] = useState(false)
  const recordingActiveRef = useRef(false)

  useEffect(() => {
    recordingActiveRef.current = isCheckingAccess || isPreparingRecording || isRecording
  }, [isCheckingAccess, isPreparingRecording, isRecording])

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    timerRef.current = null
    intervalRef.current = null
    animationFrameRef.current = null
  }

  const stopAnalyser = async () => {
    sourceRef.current?.disconnect()
    analyserRef.current?.disconnect()
    sourceRef.current = null
    analyserRef.current = null
    if (audioContextRef.current) {
      await audioContextRef.current.close().catch(() => undefined)
      audioContextRef.current = null
    }
  }

  const startAnalyser = (stream: MediaStream) => {
    const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    const audioContext = new AudioContextClass()
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 512
    analyser.smoothingTimeConstant = 0.82
    const source = audioContext.createMediaStreamSource(stream)
    source.connect(analyser)
    audioContextRef.current = audioContext
    analyserRef.current = analyser
    sourceRef.current = source
    waveformHistoryRef.current = Array.from({ length: WAVEFORM_BAR_COUNT }, () => 0.06)
    const data = new Uint8Array(analyser.fftSize)
    let lastUpdate = 0
    const tick = () => {
      analyser.getByteTimeDomainData(data)
      const now = performance.now()
      if (now - lastUpdate > 45) {
        let sum = 0
        for (let i = 0; i < data.length; i++) {
          const centered = (data[i]! - 128) / 128
          sum += centered * centered
        }
        const rms = Math.sqrt(sum / data.length)
        const level = Math.max(0.06, Math.min(1, rms * 5.5))
        waveformHistoryRef.current = [...waveformHistoryRef.current.slice(1), level]
        setLevels(waveformHistoryRef.current)
        lastUpdate = now
      }
      animationFrameRef.current = requestAnimationFrame(tick)
    }
    tick()
  }

  useEffect(() => () => {
    clearTimers()
    stopTracks()
    void stopAnalyser()
  }, [])

  useEffect(() => {
    if (feedbackState !== 'success' && feedbackState !== 'error') return
    const timeout = setTimeout(() => setFeedbackState('idle'), 1400)
    return () => clearTimeout(timeout)
  }, [feedbackState])

  const loadDevices = async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return
    setIsLoadingDevices(true)
    try {
      const availableDevices = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = availableDevices
        .filter((device) => device.kind === 'audioinput')
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: cleanDeviceLabel(device.label, index),
        }))
      setDevices(audioInputs)
      if (!selectedDeviceId && audioInputs[0]) {
        setSelectedDeviceId(audioInputs[0].deviceId)
      }
    } finally {
      setIsLoadingDevices(false)
    }
  }

  useEffect(() => {
    void loadDevices()
    if (!navigator.mediaDevices?.addEventListener) return
    navigator.mediaDevices.addEventListener('devicechange', loadDevices)
    return () => navigator.mediaDevices.removeEventListener('devicechange', loadDevices)
  }, [selectedDeviceId])

  const finishRecording = async (blob: Blob, targetAttachments: AttachmentsContext) => {
    try {
      setIsPreparingRecording(true)
      setFeedbackState('processing')
      const wavFile = await convertRecordingToWavFile(blob)
      targetAttachments.add([wavFile])
      setFeedbackState('success')
    } catch {
      setFeedbackState('error')
    } finally {
      endProcessing()
      setIsPreparingRecording(false)
    }
  }

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') recorder.stop()
  }

  const startRecording = async () => {
    if (recordingActiveRef.current) return
    setFeedbackState('idle')
    if (typeof MediaRecorder === 'undefined') {
      setFeedbackState('error')
      return
    }

    setIsCheckingAccess(true)
    const access = await requestSelectedMicrophoneAccess(selectedDeviceId)
    if (!access.ok) {
      setIsCheckingAccess(false)
      setFeedbackState('error')
      return
    }

    const stream = access.stream
    try {
      void loadDevices()
      const mimeType = getSupportedRecorderMimeType()
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunksRef.current = []
      streamRef.current = stream
      mediaRecorderRef.current = recorder
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        clearTimers()
        stopTracks()
        void stopAnalyser()
        setIsRecording(false)
        setElapsedMs(0)
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
        beginProcessing()
        void finishRecording(blob, attachments)
      }
      recorder.start()
      startAnalyser(stream)
      startedAtRef.current = Date.now()
      setIsCheckingAccess(false)
      setIsRecording(true)
      setFeedbackState('recording')
      intervalRef.current = setInterval(() => setElapsedMs(Date.now() - startedAtRef.current), 250)
      timerRef.current = setTimeout(stopRecording, MAX_RECORDING_MS)
    } catch {
      clearTimers()
      stopTracks()
      void stopAnalyser()
      setIsRecording(false)
      setIsCheckingAccess(false)
      setFeedbackState('error')
    }
  }

  useImperativeHandle(ref, () => ({
    startRecording: () => {
      void startRecording()
    },
  }))

  const recorderState: RecorderState = isRecording
    ? 'recording'
    : isPreparingRecording
      ? 'processing'
      : feedbackState

  const voiceButtonIcon = (() => {
    if (isCheckingAccess || recorderState === 'processing') return <Loader2Icon className="size-4 animate-spin" />
    if (recorderState === 'recording') return <SquareIcon className="size-4" />
    if (recorderState === 'success') return <CheckIcon className="size-4" />
    if (recorderState === 'error') return <XIcon className="size-4" />
    return <MicIcon className="size-4" />
  })()

  const isActiveRecorder = isRecording || isPreparingRecording
  const { expanded: panelExpanded, onCollapseComplete: onPanelCollapseComplete } = useDelayedExpand(isActiveRecorder)

  const recordButtonVariant = isCheckingAccess
    ? 'ghost'
    : isActiveRecorder
      ? recorderState === 'recording'
        ? 'destructive'
        : 'ghost'
      : recorderState === 'error'
        ? 'destructive'
        : 'ghost'

  const recordButtonLabel = isCheckingAccess
    ? 'Checking microphone access'
    : isActiveRecorder
      ? recorderState === 'recording'
        ? 'Stop recording'
        : 'Recording is processing'
      : 'Record audio'

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      <Button
        aria-label={recordButtonLabel}
        size="icon"
        type="button"
        variant={recordButtonVariant}
        className={cn(
          'h-8 w-8 shrink-0 transition-colors',
          !isActiveRecorder &&
            !isCheckingAccess &&
            recorderState !== 'error' &&
            cn(audioControlSurfaceClassName, audioControlSurfaceHoverClassName, 'text-foreground'),
          isCheckingAccess && cn(audioControlSurfaceHoverClassName, 'animate-pulse'),
          isActiveRecorder &&
            recorderState === 'processing' &&
            cn(audioControlSurfaceHoverClassName, 'animate-pulse'),
        )}
        onClick={isActiveRecorder && recorderState === 'recording' ? stopRecording : startRecording}
        disabled={isCheckingAccess || isPreparingRecording}
      >
        {voiceButtonIcon}
      </Button>

      <DropdownMenu onOpenChange={(open) => open && void loadDevices()}>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label="Select microphone"
            size="icon"
            type="button"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            disabled={isCheckingAccess || isPreparingRecording || isActiveRecorder}
          >
            <ChevronDownIcon className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {isLoadingDevices && (
            <DropdownMenuItem disabled>Loading microphones...</DropdownMenuItem>
          )}
          {!isLoadingDevices && devices.length === 0 && (
            <DropdownMenuItem disabled>No microphones found</DropdownMenuItem>
          )}
          {devices.map((device) => (
            <DropdownMenuItem
              key={device.deviceId}
              onSelect={() => setSelectedDeviceId(device.deviceId)}
            >
              <MicIcon className="size-4" />
              <span className="min-w-0 flex-1 truncate">{device.label}</span>
              {device.deviceId === selectedDeviceId && <CheckIcon className="size-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div
        className={cn(
          'grid min-w-0 flex-1 transition-[grid-template-columns] duration-300 ease-out',
          panelExpanded ? 'grid-cols-[1fr]' : 'grid-cols-[0fr]',
        )}
      >
        <div className="min-w-0 overflow-hidden">
          <AnimatePresence mode="popLayout" onExitComplete={onPanelCollapseComplete}>
            {isActiveRecorder && (
              <motion.div
                key="recording-panel"
                initial={{ opacity: 0, x: -8, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -8, scale: 0.98 }}
                transition={enterTransition}
                className={cn(
                  'flex h-8 min-w-0 items-center gap-1.5 rounded-md px-1',
                  audioControlSurfaceClassName,
                )}
              >
                <LiveRecordingWaveform levels={levels} active={recorderState === 'recording'} />
                <span className="mr-1.5 w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  {recorderState === 'processing' ? '...' : formatDuration(elapsedMs)}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
})
