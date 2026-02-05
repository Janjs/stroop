type SharpMusicalKey = 'A#' | 'C#' | 'D#' | 'F#' | 'G#'
type FlatMusicalKey = 'Bb' | 'Eb' | 'Ab' | 'Db' | 'Gb' | 'Cb'
type GuitarSvgSharpAndFlatKey = 'Csharp' | 'Eb' | 'Fsharp' | 'Ab' | 'Bb'

export type MusicalKey = SharpMusicalKey | FlatMusicalKey

const musicalKeyMapper: Record<MusicalKey, GuitarSvgSharpAndFlatKey> = {
  'A#': 'Bb',
  'C#': 'Csharp',
  'D#': 'Eb',
  'F#': 'Fsharp',
  'G#': 'Ab',
  Bb: 'Bb',
  Eb: 'Eb',
  Ab: 'Ab',
  Db: 'Eb',
  Gb: 'Fsharp',
  Cb: 'Bb',
}

export const mapMusicalKeyToGuitarSvg = (key: MusicalKey): GuitarSvgSharpAndFlatKey => musicalKeyMapper[key] || key

export type MusicalSuffix =
  | 'major'
  | 'minor'
  | 'diminished'
  | 'diminished seventh'
  | 'suspended second'
  | 'suspended fourth'
  | 'suspended fourth seventh'
  | 'altered'
  | 'augmented'
  | 'fifth'
  | 'sixth'
  | 'sixth added ninth'
  | 'dominant seventh'
  | 'dominant ninth'
  | 'dominant flat ninth'
  | 'dominant sharp ninth'
  | 'eleventh'
  | 'dominant thirteenth'
  | 'major seventh'
  | 'major ninth'
  | 'major thirteenth'
  | 'minor sixth'
  | 'minor seventh'
  | 'half-diminished'
  | 'minor ninth'
  | 'minor eleventh'
  | 'minor/major seventh'
  | 'minor/major ninth'

type GuitarSvgSuffix =
  | 'major'
  | 'minor'
  | 'dim'
  | 'dim7'
  | 'sus2'
  | 'sus4'
  | '7sus4'
  | 'alt'
  | 'aug'
  | '5'
  | '6'
  | '69'
  | '7'
  | '9'
  | '7b9'
  | '7#9'
  | '11'
  | '13'
  | 'maj7'
  | 'maj9'
  | 'maj13'
  | 'm6'
  | 'm7'
  | 'm7b5'
  | 'm9'
  | 'm11'
  | 'mmaj7'
  | 'mmaj9'

const musicalSuffixMapper: Record<MusicalSuffix, GuitarSvgSuffix> = {
  major: 'major',
  minor: 'minor',
  diminished: 'dim',
  'diminished seventh': 'dim7',
  'suspended second': 'sus2',
  'suspended fourth': 'sus4',
  'suspended fourth seventh': '7sus4',
  altered: 'alt',
  augmented: 'aug',
  fifth: '5',
  sixth: '6',
  'sixth added ninth': '69',
  'dominant seventh': '7',
  'dominant ninth': '9',
  'dominant flat ninth': '7b9',
  'dominant sharp ninth': '7#9',
  eleventh: '11',
  'dominant thirteenth': '13',
  'major seventh': 'maj7',
  'major ninth': 'maj9',
  'major thirteenth': 'maj13',
  'minor sixth': 'm6',
  'minor seventh': 'm7',
  'half-diminished': 'm7b5',
  'minor ninth': 'm9',
  'minor eleventh': 'm11',
  'minor/major seventh': 'mmaj7',
  'minor/major ninth': 'mmaj9',
}

export const mapMusicalSuffixToGuitarSvg = (suffix: MusicalSuffix): GuitarSvgSuffix =>
  musicalSuffixMapper[suffix] || suffix
