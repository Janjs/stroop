import assert from 'node:assert/strict'
import { analyzeSamples, isAudioFilePart } from '../lib/audio-spectrogram.ts'

const sampleRate = 44100
const seconds = 1
const samples = new Float32Array(sampleRate * seconds)
for (let i = 0; i < samples.length; i++) {
  samples[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate)
}

const analysis = analyzeSamples(samples, sampleRate)
assert.ok(Math.abs(analysis.peakHz - 440) < 20, `expected ~440Hz, got ${analysis.peakHz}`)
assert.ok(analysis.durationSec > 0.9 && analysis.durationSec <= 1, `duration ${analysis.durationSec}`)
assert.equal(analysis.bpm, null, `sine should not guess BPM, got ${analysis.bpm}`)

const pulses = new Float32Array(sampleRate * 2)
for (let beat = 0; beat < 4; beat++) {
  const start = Math.floor(beat * (sampleRate * 0.5))
  for (let i = 0; i < Math.floor(sampleRate * 0.03); i++) {
    pulses[start + i] = Math.sin((2 * Math.PI * 200 * i) / sampleRate)
  }
}
const pulsed = analyzeSamples(pulses, sampleRate)
assert.ok(pulsed.bpm !== null && Math.abs(pulsed.bpm - 120) <= 8, `expected ~120 BPM, got ${pulsed.bpm}`)
assert.equal(isAudioFilePart({ type: 'file', mediaType: 'audio/wav' }), true)
assert.equal(isAudioFilePart({ type: 'file', mediaType: 'image/png', filename: 'tone.wav' }), false)
assert.equal(isAudioFilePart({ type: 'file', filename: 'groove.mp3' }), true)
assert.equal(isAudioFilePart({ type: 'text' }), false)
console.log('ok', { peakHz: analysis.peakHz, durationSec: analysis.durationSec, bpm: pulsed.bpm })
