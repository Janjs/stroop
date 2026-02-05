const TonalMidi = require('@tonaljs/midi')

function getMidiValues() {
  try {
    const midiG0 = TonalMidi.toMidi('G0')
    const midiG1 = TonalMidi.toMidi('G1')

    console.log('MIDI value for G0:', midiG0)
    console.log('MIDI value for G1:', midiG1)
  } catch (error) {
    console.error('An error occurred:', error.message)
  }
}

getMidiValues()
