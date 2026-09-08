import type { FileUIPart } from 'ai'

export const MAX_AUDIO_SECONDS = 30
const FFT_SIZE = 2048
const HOP = 512
const MIN_HZ = 40
const MAX_HZ = 8000

export type SpectrogramAnalysis = {
  durationSec: number
  peakHz: number
  bpm: number | null
}

function fft(re: Float64Array, im: Float64Array) {
  const n = re.length
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      const r = re[i]!
      re[i] = re[j]!
      re[j] = r
      const m = im[i]!
      im[i] = im[j]!
      im[j] = m
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len
    const wlenRe = Math.cos(ang)
    const wlenIm = Math.sin(ang)
    for (let i = 0; i < n; i += len) {
      let wRe = 1
      let wIm = 0
      const half = len >> 1
      for (let j = 0; j < half; j++) {
        const even = i + j
        const odd = even + half
        const vr = re[odd]! * wRe - im[odd]! * wIm
        const vi = re[odd]! * wIm + im[odd]! * wRe
        re[odd] = re[even]! - vr
        im[odd] = im[even]! - vi
        re[even] += vr
        im[even] += vi
        const nwRe = wRe * wlenRe - wIm * wlenIm
        wIm = wRe * wlenIm + wIm * wlenRe
        wRe = nwRe
      }
    }
  }
}

function hann(n: number) {
  const w = new Float64Array(n)
  for (let i = 0; i < n; i++) w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)))
  return w
}

export function analyzeSamples(samples: Float32Array, sampleRate: number): SpectrogramAnalysis & { frames: Float32Array[] } {
  const maxSamples = Math.floor(sampleRate * MAX_AUDIO_SECONDS)
  const sliced = samples.length > maxSamples ? samples.subarray(0, maxSamples) : samples
  const window = hann(FFT_SIZE)
  const frames: Float32Array[] = []
  const avg = new Float64Array(FFT_SIZE / 2)

  for (let i = 0; i + FFT_SIZE <= sliced.length; i += HOP) {
    const re = new Float64Array(FFT_SIZE)
    const im = new Float64Array(FFT_SIZE)
    for (let j = 0; j < FFT_SIZE; j++) re[j] = sliced[i + j]! * window[j]!
    fft(re, im)
    const mag = new Float32Array(FFT_SIZE / 2)
    for (let k = 0; k < mag.length; k++) {
      const v = Math.hypot(re[k]!, im[k]!)
      mag[k] = v
      avg[k] += v
    }
    frames.push(mag)
  }

  if (frames.length === 0) {
    const mag = new Float32Array(FFT_SIZE / 2)
    frames.push(mag)
  }

  let peakBin = 1
  for (let k = 1; k < avg.length; k++) {
    if (avg[k]! > avg[peakBin]!) peakBin = k
  }

  return {
    frames,
    durationSec: sliced.length / sampleRate,
    peakHz: (peakBin * sampleRate) / FFT_SIZE,
    bpm: estimateBpm(sliced, sampleRate),
  }
}

// ponytail: onset autocorrelation, replace with a beat tracker if tempo guesses go stale
function estimateBpm(samples: Float32Array, sampleRate: number): number | null {
  const hop = Math.max(1, Math.floor(sampleRate / 100))
  const flux: number[] = []
  let prev = 0
  for (let i = 0; i + hop <= samples.length; i += hop) {
    let energy = 0
    for (let j = 0; j < hop; j++) {
      const s = samples[i + j]!
      energy += s * s
    }
    const env = Math.sqrt(energy / hop)
    flux.push(Math.max(0, env - prev))
    prev = env
  }
  const peakFlux = Math.max(...flux)
  if (flux.length < 40 || peakFlux <= 0) return null
  let onsets = 0
  const onsetFloor = peakFlux * 0.4
  for (let i = 1; i < flux.length - 1; i++) {
    if (flux[i]! >= onsetFloor && flux[i]! >= flux[i - 1]! && flux[i]! >= flux[i + 1]!) onsets += 1
  }
  if (onsets < 3) return null

  const minLag = Math.round((60 / 180) * 100)
  const maxLag = Math.round((60 / 60) * 100)
  let bestLag = 0
  let best = 0
  let total = 0
  let count = 0
  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0
    for (let i = 0; i + lag < flux.length; i++) sum += flux[i]! * flux[i + lag]!
    total += sum
    count += 1
    if (sum > best) {
      best = sum
      bestLag = lag
    }
  }
  const mean = count ? total / count : 0
  if (!bestLag || best <= 0 || best < mean * 2.5) return null
  return Math.round(60 / (bestLag / 100))
}

function heat(t: number): [number, number, number] {
  const x = Math.min(1, Math.max(0, t))
  return [
    Math.min(255, Math.floor(16 + x * 280 + x * x * 80)),
    Math.min(255, Math.floor(x * x * 200)),
    Math.min(255, Math.floor(48 + (1 - x) * 40 + x * 30)),
  ]
}

function hzToY(hz: number, height: number) {
  const minL = Math.log(MIN_HZ)
  const maxL = Math.log(MAX_HZ)
  const t = (Math.log(Math.min(MAX_HZ, Math.max(MIN_HZ, hz))) - minL) / (maxL - minL)
  return Math.round((1 - t) * (height - 1))
}

export function renderSpectrogramPng(frames: Float32Array[], sampleRate: number, analysis: SpectrogramAnalysis): string {
  const width = 768
  const height = 288
  const left = 40
  const top = 28
  const right = 8
  const bottom = 22
  const innerW = width - left - right
  const innerH = height - top - bottom

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not draw spectrogram')

  ctx.fillStyle = '#0b0b10'
  ctx.fillRect(0, 0, width, height)

  const bins = frames[0]?.length ?? FFT_SIZE / 2
  let min = Infinity
  let max = -Infinity
  const logs: Float32Array[] = frames.map((frame) => {
    const out = new Float32Array(frame.length)
    for (let k = 0; k < frame.length; k++) {
      const v = Math.log10(1 + frame[k]!)
      out[k] = v
      if (v < min) min = v
      if (v > max) max = v
    }
    return out
  })
  const span = Math.max(1e-6, max - min)

  const image = ctx.createImageData(innerW, innerH)
  for (let x = 0; x < innerW; x++) {
    const fi = Math.min(logs.length - 1, Math.floor((x / innerW) * logs.length))
    const frame = logs[fi]!
    for (let y = 0; y < innerH; y++) {
      const t = 1 - y / (innerH - 1)
      const hz = Math.exp(Math.log(MIN_HZ) + t * (Math.log(MAX_HZ) - Math.log(MIN_HZ)))
      const bin = Math.min(bins - 1, Math.max(1, (hz * FFT_SIZE) / sampleRate))
      const lo = Math.floor(bin)
      const hi = Math.min(bins - 1, lo + 1)
      const frac = bin - lo
      const v = ((frame[lo]! * (1 - frac) + frame[hi]! * frac) - min) / span
      const [r, g, b] = heat(v)
      const i = (y * innerW + x) * 4
      image.data[i] = r
      image.data[i + 1] = g
      image.data[i + 2] = b
      image.data[i + 3] = 255
    }
  }
  ctx.putImageData(image, left, top)

  ctx.fillStyle = '#d4d4d8'
  ctx.font = '11px ui-sans-serif, system-ui, sans-serif'
  const bpm = analysis.bpm ? ` · ~${analysis.bpm} BPM` : ''
  ctx.fillText(`log spectrogram · ${analysis.durationSec.toFixed(1)}s${bpm}`, left, 18)

  ctx.fillStyle = '#a1a1aa'
  ctx.font = '10px ui-sans-serif, system-ui, sans-serif'
  for (const hz of [100, 250, 500, 1000, 2000, 4000, 8000]) {
    const y = top + hzToY(hz, innerH)
    ctx.fillText(hz >= 1000 ? `${hz / 1000}k` : String(hz), 4, y + 3)
  }
  ctx.fillText('0s', left, height - 6)
  ctx.fillText(`${analysis.durationSec.toFixed(1)}s`, width - 36, height - 6)

  return canvas.toDataURL('image/png')
}

function mixMono(buffer: AudioBuffer) {
  const length = buffer.length
  const out = new Float32Array(length)
  const channels = buffer.numberOfChannels
  for (let c = 0; c < channels; c++) {
    const data = buffer.getChannelData(c)
    for (let i = 0; i < length; i++) out[i] += data[i]! / channels
  }
  return out
}

export function formatSpectrogramCaption(analysis: SpectrogramAnalysis) {
  const bpm = analysis.bpm ? `, ~${analysis.bpm} BPM` : ''
  return `Spectrogram of ${analysis.durationSec.toFixed(1)}s of audio${bpm}.`
}

export async function decodeAudioFile(file: Blob) {
  const ctx = new AudioContext()
  try {
    const buffer = await ctx.decodeAudioData(await file.arrayBuffer())
    return { samples: mixMono(buffer), sampleRate: buffer.sampleRate }
  } finally {
    await ctx.close()
  }
}

export async function audioBlobToSpectrogramPart(blob: Blob, filename = 'audio'): Promise<{ file: FileUIPart; analysis: SpectrogramAnalysis; caption: string }> {
  const { samples, sampleRate } = await decodeAudioFile(blob)
  const analysis = analyzeSamples(samples, sampleRate)
  const url = renderSpectrogramPng(analysis.frames, sampleRate, analysis)
  return {
    file: {
      type: 'file',
      mediaType: 'image/png',
      url,
      filename: `${filename.replace(/\.[^.]+$/, '') || 'audio'}-spectrogram.png`,
    },
    analysis,
    caption: formatSpectrogramCaption(analysis),
  }
}

async function blobFromFilePart(file: FileUIPart) {
  const response = await fetch(file.url)
  return response.blob()
}

export async function filePartsToSpectrograms(files: FileUIPart[]) {
  const out: FileUIPart[] = []
  const captions: string[] = []
  for (const file of files) {
    if (file.mediaType?.startsWith('image/')) {
      out.push(file)
      continue
    }
    const blob = await blobFromFilePart(file)
    const converted = await audioBlobToSpectrogramPart(blob, file.filename ?? 'audio')
    out.push(converted.file)
    captions.push(converted.caption)
  }
  return { files: out, caption: captions.join(' ') }
}
