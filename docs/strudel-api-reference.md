# Strudel API Reference

Auto-generated from the official Strudel JSDoc source ([codeberg.org/uzu/strudel](https://codeberg.org/uzu/strudel)),
the same data that powers the Reference tab on [strudel.cc](https://strudel.cc/).

Regenerate with: `STRUDEL_DOC_JSON=/path/to/doc.json node scripts/generate-strudel-api-reference.mjs`

512 functions. You do not need all of these — a small set covers most patterns.

## absoluteOrientationAlpha
Synonyms: absOriA, absOriZ, absoluteOrientationZ
Tags: external_io

The device's absolute orientation alpha value ranges from 0 to 1.

```strudel
n(absoluteOrientationAlpha.segment(4).range(0,7)).scale("C:minor")
```

## absoluteOrientationBeta
Synonyms: absOriB, absOriX, absoluteOrientationX
Tags: external_io

The device's absolute orientation beta value ranges from 0 to 1.

```strudel
n(absoluteOrientationBeta.segment(4).range(0,7)).scale("C:minor")
```

## absoluteOrientationGamma
Synonyms: absOriG, absOriY, absoluteOrientationY
Tags: external_io

The device's absolute orientation gamma value ranges from 0 to 1.

```strudel
n(absoluteOrientationGamma.segment(4).range(0,7)).scale("C:minor")
```

## accelerationX
Synonyms: accX
Tags: external_io

The accelerometer's x-axis value ranges from 0 to 1.

```strudel
n(accelerationX.segment(4).range(0,7)).scale("C:minor")
```

## accelerationY
Synonyms: accY
Tags: external_io

The accelerometer's y-axis value ranges from 0 to 1.

```strudel
n(accelerationY.segment(4).range(0,7)).scale("C:minor")
```

## accelerationZ
Synonyms: accZ
Tags: external_io

The accelerometer's z-axis value ranges from 0 to 1.

```strudel
n(accelerationZ.segment(4).range(0,7)).scale("C:minor")
```

## add
Tags: math

Assumes a pattern of numbers. Adds the given number to each item in the pattern.

```strudel
// Here, the triad 0, 2, 4 is shifted by different amounts
n("0 2 4".add("<0 3 4 0>")).scale("C:major")
// Without add, the equivalent would be:
// n("<[0 2 4] [3 5 7] [4 6 8] [0 2 4]>").scale("C:major")
```

```strudel
// You can also use add with notes:
note("c3 e3 g3".add("<0 5 7 0>"))
// Behind the scenes, the notes are converted to midi numbers:
// note("48 52 55".add("<0 5 7 0>"))
```

## addVoicings
Tags: tonal

Adds a new custom voicing dictionary.

Parameters:
- `name` (string) — identifier for the voicing dictionary
- `dictionary` (Object) — maps chord symbol to possible voicings
- `range` (Array) — min, max note

```strudel
addVoicings('cookie', {
  7: ['3M 7m 9M 12P 15P', '7m 10M 13M 16M 19P'],
  '^7': ['3M 6M 9M 12P 14M', '7M 10M 13M 16M 19P'],
  m7: ['8P 11P 14m 17m 19P', '5P 8P 11P 14m 17m'],
  m7b5: ['3m 5d 8P 11P 14m', '5d 8P 11P 14m 17m'],
  o7: ['3m 6M 9M 11A 15P'],
  '7alt': ['3M 7m 10m 13m 15P'],
  '7#11': ['7m 10m 13m 15P 17m'],
}, ['C3', 'C6'])
"<C^7 A7 Dm7 G7>".voicings('cookie').note()
```

## adsr
Tags: envelope, amplitude

ADSR envelope: Combination of Attack, Decay, Sustain, and Release.

Parameters:
- `time` (number | Pattern) — attack time in seconds
- `time` (number | Pattern) — decay time in seconds
- `gain` (number | Pattern) — sustain level (0 to 1)
- `time` (number | Pattern) — release time in seconds

```strudel
note("[c3 bb2 f3 eb3]*2").sound("sawtooth").lpf(600).adsr(".1:.1:.5:.2")
```

## aliasBank
Tags: samples

Register an alias for a bank of sounds.
Optionally accepts a single argument map of bank aliases.
Optionally accepts a single argument string of a path to a JSON file containing bank aliases.

Parameters:
- `bank` (string) — The bank to alias
- `alias` (string) — The alias to use for the bank

## all
Tags: combiners

Applies a function to all the running patterns. Note that the patterns are grouped together into a single stack before the function is applied. This is probably what you want, but see each for
a version that applies the function to each pattern separately.

Note: Patterns must be labeled (e.g. with $:) to be picked up by all. An unlabeled
pattern such as note("c4") is not registered and will produce no audio when all is present.
Use $: note("c4") instead.

$: sound("bd - cp sd")
$: sound("hh*8")
all(fast("<2 3>"))

$: sound("bd - cp sd")
$: sound("hh*8")
all(x => x.pianoroll())

## almostAlways
Tags: temporal

Shorthand for .sometimesBy(0.9, fn)

```strudel
s("hh*8").almostAlways(x=>x.speed("0.5"))
```

## almostNever
Tags: temporal

Shorthand for .sometimesBy(0.1, fn)

```strudel
s("hh*8").almostNever(x=>x.speed("0.5"))
```

## always
Tags: temporal

Shorthand for .sometimesBy(1, fn) (always calls fn)

```strudel
s("hh*8").always(x=>x.speed("0.5"))
```

## anchor
Tags: tonal

The top note to align the voicing to. Defaults to c5

Parameters:
- `anchorNote` (string | Pattern) — the note to align the voicing or scale to

```strudel
anchor("<c4 g4 c5 g5>").chord("C").voicing()
```

```strudel
n("0 .. 7").anchor("<c4 g4 c5 g5>").scale("<C:major F:minor>")
```

## appBoth
Tags: functional

When this method is called on a pattern of functions, it matches its haps
with those in the given pattern of values.  A new pattern is returned, with
each matching value applied to the corresponding function.

In this _appBoth variant, where timespans of the function and value haps
are not the same but do intersect, the resulting hap has a timespan of the
intersection. This applies to both the part and the whole timespan.

Parameters:
- `pat_val` (Pattern)

## appLeft
Tags: functional

As with appBoth, but the whole timespan is not the intersection,
but the timespan from the function of patterns that this method is called
on. In practice, this means that the pattern structure, including onsets,
are preserved from the pattern of functions (often referred to as the left
hand or inner pattern).

Parameters:
- `pat_val` (Pattern)

## apply
Tags: combiners

Applies the given function to the pattern. Like layer, but with a single function:

```strudel
"<c3 eb3 g3>".scale('C minor').apply(scaleTranspose("0,2,4")).note()
```

## applyGradualLowpass
Tags: internals

Applies a constantly changing lowpass filter to the given sound.

Parameters:
- `input` (AudioBuffer)
- `lpFreqStart` (number)
- `lpFreqEnd` (number)
- `lpFreqEndAt` (number)
- `callback` (function) — May be called
immediately within the current execution context, or later.

## applyHannWindow
Tags: internals

Apply Hann window in-place

## appRight
Tags: functional

As with appLeft, but whole timespans are instead taken from the
pattern of values, i.e. structure is preserved from the right hand/outer
pattern.

Parameters:
- `pat_val` (Pattern)

## appWhole
Tags: functional

Assumes 'this' is a pattern of functions, and given a function to
resolve wholes, applies a given pattern of values to that
pattern of functions.

Parameters:
- `whole_func` (function)
- `func` (function)

## arp
Tags: temporal

Selects indices in in stacked notes.

```strudel
note("<[c,eb,g]!2 [c,f,ab] [d,f,ab]>")
.arp("0 [0,2] 1 [0,2]")
```

## arpWith
Tags: temporal

Selects indices in in stacked notes.

```strudel
note("<[c,eb,g]!2 [c,f,ab] [d,f,ab]>")
.arpWith(haps => haps[2])
```

## arrange
Tags: combiners

Allows to arrange multiple patterns together over multiple cycles.
Takes a variable number of arrays with two elements specifying the number of cycles and the pattern to use.

```strudel
arrange(
  [4, "<c a f e>(3,8)"],
  [2, "<g a>(5,8)"]
).note()
```

## as
Tags: combiners

Sets properties in a batch.

Parameters:
- `mapping` (String | Array) — the control names that are set

```strudel
"c:.5 a:1 f:.25 e:.8".as("note:clip")
```

```strudel
"{0@2 0.25 0 0.5 .3 .5}%8".as("begin").s("sax_vib").clip(1)
```

## asNumber
Tags: internals

Returns a new pattern with all values parsed as numerals.

## asym
Tags: distortion, superdough

Asymmetrical diode distortion

Parameters:
- `distortion` (number | Pattern) — amount of distortion to apply
- `volume` (number | Pattern) — linear postgain of the distortion

## attack
Synonyms: att
Tags: amplitude, envelope, superdough

Amplitude envelope attack time: Specifies how long it takes for the sound to reach its peak value, relative to the onset.

Parameters:
- `attack` (number | Pattern) — time in seconds.

```strudel
note("c3 e3 f3 g3").attack("<0 .1 .5>")
```

## bank
Tags: samples, superdough

Select the sound bank to use. To be used together with s. The bank name (+ "_") will be prepended to the value of s.

Parameters:
- `bank` (string | Pattern) — the name of the bank

```strudel
s("bd sd [~ bd] sd").bank('RolandTR909') // = s("RolandTR909_bd RolandTR909_sd")
```

## base
Tags: generators

Creates a pattern of numbers in base b from a number or pattern of numbers
limited to d digits long from the right

Parameters:
- `n` (number) — number to convert (can be a pattern or array)
- `b` (number) — base to convert to (defaults to 10) (can be a pattern)
- `d` (number) — max number of digits to produce for each n (defaults to 0 for all) (can be a pattern)

```strudel
$: note(base("7175 543", 10, 3)).scale("c:major").s("saw")
// $: note("1 7 5 5 4 3").scale("c:major").s("saw")
```

## beat
Tags: temporal

creates a structure pattern from divisions of a cycle
especially useful for creating rhythms

```strudel
s("bd").beat("0,7,10", 16)
```

```strudel
s("sd").beat("4,12", 16)
```

## begin
Tags: samples

A pattern of numbers from 0 to 1. Skips the beginning of each sample, e.g. 0.25 to cut off the first quarter from each sample.

Parameters:
- `amount` (number | Pattern) — between 0 and 1, where 1 is the length of the sample

```strudel
samples({ rave: 'rave/AREUREADY.wav' }, 'github:tidalcycles/dirt-samples')
s("rave").begin("<0 .25 .5 .75>").fast(2)
```

## berlin
Tags: generators

Generates a continuous pattern of [berlin noise](conceived by Jame Coyne and Jade Rowland as a joke but turned out to be surprisingly cool and useful,
like perlin noise but with sawtooth waves), in the range 0..1.

```strudel
// ascending arpeggios
n("0!16".add(berlin.fast(4).mul(14))).scale("d:minor")
```

## binary
Tags: generators

Creates a binary pattern from a number.

Parameters:
- `n` (number) — input number to convert to binary

```strudel
"hh".s().struct(binary(5))
// "hh".s().struct("1 0 1")
```

## binaryL
Tags: generators

Creates a binary list pattern from a number.

Parameters:
- `n` (number) — input number to convert to binary
s("saw").seg(8)
.partials(binaryL(irand(4096).add(1)))

## binaryN
Tags: generators

Creates a binary pattern from a number, padded to n bits long.

Parameters:
- `n` (number) — input number to convert to binary
- `nBits` (number) — pattern length, defaults to 16

```strudel
"hh".s().struct(binaryN(55532, 16))
// "hh".s().struct("1 1 0 1 1 0 0 0 1 1 1 0 1 1 0 0")
```

## binaryNL
Tags: generators

Creates a binary list pattern from a number, padded to n bits long.

Parameters:
- `n` (number) — input number to convert to binary
- `nBits` (number) — pattern length, defaults to 16

## bite
Tags: temporal

Splits a pattern into the given number of slices, and plays them according to a pattern of slice numbers.
Similar to slice, but slices up patterns rather than sound samples.

Parameters:
- `number` (number) — of slices
- `slices` (number) — to play

```strudel
note("0 1 2 3 4 5 6 7".scale('c:mixolydian'))
.bite(4, "3 2 1 0")
```

```strudel
sound("bd - bd bd*2, - sd:6 - sd:5 sd:1 - [- sd:2] -, hh [- cp:7]")
  .bank("RolandTR909").speed(1.2)
  .bite(4, "0 0 [1 2] <3 2> 0 0 [2 1] 3")
```

## bmod
Tags: superdough

Modulates with the output from a given bus.
Can be called in sequence like pat.bmod(...).bmod(...) to set up multiple modulators

Send to an audio bus with otherPat.bus(..).

There are two ways to declare which control will be modulated:

Explicitly put control in the config (e.g. bmod({ id: 2, c: "lpf" }))
If the control parameter is absent, the control immediately before the bmod call will be used
(e.g. s("saw").lpf(500).bmod({ id: 2 }) to modulate lpf)

Modulators can be referred to by id so that they can be updated later e.g. inside
a sometimes. See example below.

Parameters:
- `config` (Object) — Bus modulation configuration.
- `config.bus` (string | Pattern) — Bus to get modulation signal from
- `config.control` (string | Pattern) — Node to modulate. Aliases: c
- `config.subControl` (string | Pattern) — Sub-control name to append to the control key. Aliases: sc
- `config.depth` (number | Pattern) — Relative modulation depth. Aliases: dep, dr
- `config.depthabs` (number | Pattern) — Absolute modulation depth. Aliases: da
- `config.dc` (number | Pattern) — DC offset prior to application
- `config.fxi` (number | Pattern) — FX index to target
- `id` (string | Pattern) — ID to use for this modulator

```strudel
modulator: s("one").seg(64).gain(slider(0, 0, 1)).bus(1).dry(0)
carrier: s("saw").bmod({ b: 1 })
```

## bpattack
Synonyms: bpa
Tags: filter, envelope, superdough

Sets the attack duration for the bandpass filter envelope.

Parameters:
- `attack` (number | Pattern) — time of the bandpass filter envelope

```strudel
note("c2 e2 f2 g2")
.sound('sawtooth')
.bpf(500)
.bpa("<.5 .25 .1 .01>/4")
.bpenv(4)
```

## bpdc
Tags: filter, lfo, superdough

DC offset of the LFO for the bandpass filter

Parameters:
- `dcoffset` (number | Pattern) — dc offset. set to 0 for unipolar

## bpdecay
Synonyms: bpd
Tags: filter, envelope, superdough

Sets the decay duration for the bandpass filter envelope.

Parameters:
- `decay` (number | Pattern) — time of the bandpass filter envelope

```strudel
note("c2 e2 f2 g2")
.sound('sawtooth')
.bpf(500)
.bpd("<.5 .25 .1 0>/4")
.bps(0.2)
.bpenv(4)
```

## bpdepth
Tags: filter, lfo, superdough

Depth of the LFO for the bandpass filter

Parameters:
- `depth` (number | Pattern) — depth of modulation

## bpdepthfrequency
Synonyms: bpdepthfreq
Tags: filter, lfo, superdough

Depth of the LFO for the bandpass filter, in HZ

Parameters:
- `depth` (number | Pattern) — depth of modulation

```strudel
note("<c c c# c c c4>*16").s("sawtooth").lpf(600).bpdepthfrequency("<200 500 100 0>")
```

## bpenv
Synonyms: bpe
Tags: filter, envelope, superdough

Sets the bandpass filter envelope modulation depth.

Parameters:
- `modulation` (number | Pattern) — depth of the bandpass filter envelope between 0 and n

```strudel
note("c2 e2 f2 g2")
.sound('sawtooth')
.bpf(500)
.bpa(.5)
.bpenv("<4 2 1 0 -1 -2 -4>/4")
```

## bpf
Synonyms: bandf, bp
Tags: filter, superdough

Sets the center frequency of the band-pass filter. When using mininotation, you
can also optionally supply the 'bpq' parameter separated by ':'.

Parameters:
- `frequency` (number | Pattern) — center frequency

```strudel
s("bd sd [~ bd] sd,hh*6").bpf("<1000 2000 4000 8000>")
```

## bpq
Synonyms: bandq
Tags: filter, superdough

Sets the band-pass q-factor (resonance).

Parameters:
- `q` (number | Pattern) — q factor

```strudel
s("bd sd [~ bd] sd").bpf(500).bpq("<0 1 2 3>")
```

## bprate
Tags: filter, lfo, superdough

Rate of the LFO for the bandpass filter

Parameters:
- `rate` (number | Pattern) — rate in hertz

## bprelease
Synonyms: bpr
Tags: filter, envelope, superdough

Sets the release time for the bandpass filter envelope.

Parameters:
- `release` (number | Pattern) — time of the bandpass filter envelope

```strudel
note("c2 e2 f2 g2")
.sound('sawtooth')
.clip(.5)
.bpf(500)
.bpenv(4)
.bpr("<.5 .25 .1 0>/4")
.release(.5)
```

## bpshape
Tags: filter, lfo, superdough

Shape of the LFO for the bandpass filter

Parameters:
- `shape` (number | Pattern) — Shape of the lfo (0, 1, 2, ..)

## bpskew
Tags: filter, lfo, superdough

Skew of the LFO for the bandpass filter

Parameters:
- `skew` (number | Pattern) — How much to bend the LFO shape

## bpsustain
Synonyms: bps
Tags: filter, envelope, superdough

Sets the sustain amplitude for the bandpass filter envelope.

Parameters:
- `sustain` (number | Pattern) — amplitude of the bandpass filter envelope

```strudel
note("c2 e2 f2 g2")
.sound('sawtooth')
.bpf(500)
.bpd(.5)
.bps("<0 .25 .5 1>/4")
.bpenv(4)
```

## bpsync
Tags: filter, lfo, superdough

Cycle-synced rate of the LFO for the bandpass filter

Parameters:
- `rate` (number | Pattern) — rate in cycles

## brak
Tags: temporal

Returns a new pattern where every other cycle is played once, twice as
fast, and offset in time by one quarter of a cycle. Creates a kind of
breakbeat feel.

## brand
Tags: generators

A continuous pattern of 0 or 1 (binary random)

```strudel
s("hh*10").pan(brand)
```

## brandBy
Tags: generators

A continuous pattern of 0 or 1 (binary random), with a probability for the value being 1

Parameters:
- `probability` (number) — a number between 0 and 1

```strudel
s("hh*10").pan(brandBy(0.2))
```

## byteBeatExpression
Synonyms: bbexpr, bb
Tags: superdough

Create byte beats with custom expressions

Parameters:
- `byteBeatExpression` (number | Pattern) — bitwise expression for creating bytebeat

```strudel
s("bytebeat").bbexpr('t*(t>>15^t>>66)')
```

## byteBeatStartTime
Synonyms: bbst
Tags: superdough

Create byte beats with custom expressions

Parameters:
- `byteBeatStartTime` (number | Pattern) — in samples (t)

```strudel
note("c3!8".add("{0 0 12 0 7 5 3}%8")).s("bytebeat:5").bbst("<3 1>".mul(10000))._scope()
```

## cat
Synonyms: slowcat
Tags: combiners

The given items are concatenated, where each one takes one cycle.

Parameters:
- `items` (any) — The items to concatenate

```strudel
cat("e5", "b4", ["d5", "c5"]).note()
// "<e5 b4 [d5 c5]>".note()
```

```strudel
// As a chained function:
s("hh*4").cat(
   note("c4(5,8)")
)
```

## ccn
Tags: external_io, midi

MIDI control number: Sends a MIDI control change message.

Parameters:
- `MIDI` (number | Pattern) — control number (0-127)

## ccv
Tags: external_io, midi

MIDI control value: Sends a MIDI control change message.

Parameters:
- `MIDI` (number | Pattern) — control value (0-127)

## ceil
Tags: math

Assumes a numerical pattern. Returns a new pattern with all values set to
their mathematical ceiling. E.g. 3.2 replaced with 4, and -4.2
replaced with -4.

```strudel
note("42 42.1 42.5 43".ceil())
```

## channel
Tags: superdough

Choose the channel the pattern is sent to

Parameters:
- `channel` (number | Pattern) — channel number

## channels
Synonyms: ch
Tags: external_io, superdough

Allows you to set the output channels on the interface

Parameters:
- `channels` (number | Pattern) — pattern the output channels

```strudel
note("e a d b g").channels("3:4")
```

## chebyshev
Tags: distortion, superdough

Distortion via Chebyshev polynomials

Parameters:
- `distortion` (number | Pattern) — amount of distortion to apply
- `volume` (number | Pattern) — linear postgain of the distortion

## choose
Tags: temporal

Chooses randomly from the given list of elements.

Parameters:
- `xs` (any) — values / patterns to choose from.

```strudel
note("c2 g2!2 d2 f1").s(choose("sine", "triangle", "bd:6"))
```

## choose2
Tags: temporal

As with choose, but the pattern that this method is called on should be
in the range -1 .. 1

Parameters:
- `xs` (any)

## chooseCycles
Synonyms: randcat
Tags: temporal

Picks one of the elements at random each cycle.

```strudel
chooseCycles("bd", "hh", "sd").s().fast(8)
```

```strudel
s("bd | hh | sd").fast(8)
```

## chooseInWith
Tags: temporal

As with {chooseWith}, but the structure comes from the chosen values, rather
than the pattern you're using to choose with.

Parameters:
- `pat` (Pattern)
- `xs` (*)

## chooseWith
Tags: temporal

Choose from the list of values (or patterns of values) using the given
pattern of numbers, which should be in the range of 0..1

Parameters:
- `pat` (Pattern)
- `xs` (*)

```strudel
note("c2 g2!2 d2 f1").s(chooseWith(sine.fast(2), ["sawtooth", "triangle", "bd:6"]))
```

## chop
Tags: samples

Cuts each sample into the given number of parts, allowing you to explore a technique known as 'granular synthesis'.
It turns a pattern of samples into a pattern of parts of samples.

```strudel
samples({ rhodes: 'https://cdn.freesound.org/previews/132/132051_316502-lq.mp3' })
s("rhodes")
 .chop(4)
 .rev() // reverse order of chops
 .loopAt(2) // fit sample into 2 cycles
```

## chord
Tags: tonal

The chord to voice

Parameters:
- `symbols` (string | Pattern) — chord symbols to voice e.g., C, Eb, Fm7, G7. The symbols can be defined via addVoicings

```strudel
chord("<Am C D F Am E Am E>").voicing()
```

## chorus
Tags: pitch

mix control for the chorus effect

Parameters:
- `chorus` (string | Pattern) — mix amount between 0 and 1

```strudel
note("d d a# a").s("sawtooth").chorus(.5)
```

## chunk
Synonyms: slowChunk, slowchunk
Tags: temporal, functional

Divides a pattern into a given number of parts, then cycles through those parts in turn, applying the given function to each part in turn (one part per cycle).

```strudel
"0 1 2 3".chunk(4, x=>x.add(7))
.scale("A:minor").note()
```

## chunkBack
Synonyms: chunkback
Tags: temporal

Like chunk, but cycles through the parts in reverse order. Known as chunk' in tidalcycles

```strudel
"0 1 2 3".chunkBack(4, x=>x.add(7))
.scale("A:minor").note()
```

## chunkBackInto
Synonyms: chunkbackinto
Tags: temporal

Like chunkInto, but moves backwards through the chunks.

```strudel
sound("bd sd ht lt bd - cp lt").chunkInto(4, hurry(2))
  .bank("tr909")
```

## chunkInto
Synonyms: chunkinto
Tags: temporal

Like chunk, but the function is applied to a looped subcycle of the source pattern.

```strudel
sound("bd sd ht lt bd - cp lt").chunkInto(4, hurry(2))
  .bank("tr909")
```

## chyx
Tags: internals

BYTE BEATS

## clearScope

Clears all user-defined variables and functions from the scope.
This removes variables created during block-based evaluation.

```strudel
// After defining variables in blocks:
// let myVar = 5
// function myFunc() { return 10; }
clearScope() // removes myVar and myFunc from scope
```

## clip
Synonyms: legato
Tags: superdough

Multiplies the duration with the given number. Also cuts samples off at the end if they exceed the duration.

Parameters:
- `factor` (number | Pattern) — = 0

```strudel
note("c a f e").s("piano").clip("<.5 1 2>")
```

## coarse
Tags: superdough

Fake-resampling for lowering the sample rate. Caution: This effect seems to only work in chromium based browsers

Parameters:
- `factor` (number | Pattern) — 1 for original 2 for half, 3 for a third and so on.

```strudel
s("bd sd [~ bd] sd,hh*8").coarse("<1 4 8 16 32>")
```

## color
Synonyms: colour
Tags: visualization

Sets the color of the hap in visualizations like pianoroll or highlighting.

Parameters:
- `color` (string) — Hexadecimal or CSS color name

## compress
Tags: temporal

Compress each cycle into the given timespan, leaving a gap

```strudel
cat(
  s("bd sd").compress(.25,.75),
  s("~ bd sd ~")
)
```

## compressor
Tags: superdough

Dynamics Compressor. The params are compressor("threshold:ratio:knee:attack:release")
More info here

```strudel
s("bd sd [~ bd] sd,hh*8")
.compressor("-20:20:10:.002:.02")
```

## computeMagnitudes
Tags: internals

Compute squared magnitudes for peak finding

## contract
Tags: stepwise

Experimental

Contracts the step size of the pattern by the given factor. See also expand.

```strudel
sound("tha dhi thom nam").bank("mridangam").contract("3 2 1 1 2 3").pace(8)
```

## control
Tags: external_io, midi

MIDI control: Sends a MIDI control change message.

Parameters:
- `MIDI` (number | Pattern) — control number (0-127)
- `MIDI` (number | Pattern) — controller value (0-127)

## cosine
Tags: generators

A cosine signal between 0 and 1.

```strudel
n(stack(sine,cosine).segment(16).range(0,15))
.scale("C:minor")
```

## cosine2
Tags: generators

A cosine signal between -1 and 1 (like cosine, but bipolar).

## cpm
Tags: temporal

Plays the pattern at the given cycles per minute.

```strudel
s("<bd sd>,hh*2").cpm(90) // = 90 bpm
```

## createCC

Implementation for the cc() factory function tied to this specific input.

Parameters:
- `cc` (number) — MIDI CC number
- `chan` (number | undefined) — MIDI channel (1-16) or undefined for all channels

## crossfade
Tags: internals

Equal Power Crossfade function.
Smoothly transitions between signals A and B, maintaining consistent perceived loudness.

Parameters:
- `a` (number) — Signal A (can be a single value or an array value in buffer processing).
- `b` (number) — Signal B (can be a single value or an array value in buffer processing).
- `m` (number) — Crossfade parameter (0.0 = all A, 1.0 = all B, 0.5 = equal mix).

## crush
Tags: superdough

Bit crusher effect.

Parameters:
- `depth` (number | Pattern) — between 1 (for drastic reduction in bit-depth) to 16 (for barely no reduction).

```strudel
s("<bd sd>,hh*3").fast(2).crush("<16 8 7 6 5 4 3 2>")
```

## csoundm
Tags: external_io

Sends notes to Csound for rendering with MIDI semantics. The hap value is
translated to these Csound pfields:

p1 -- Csound instrument either as a number (1-based, can be a fraction),
or as a string name.
p2 -- time in beats (usually seconds) from start of performance.
p3 -- duration in beats (usually seconds).
p4 -- MIDI key number (as a real number, not an integer but in [0, 127].
p5 -- MIDI velocity (as a real number, not an integer but in [0, 127].
p6 -- Strudel controls, as a string.

## cubic
Tags: distortion, superdough

Cubic polynomial distortion

Parameters:
- `distortion` (number | Pattern) — amount of distortion to apply
- `volume` (number | Pattern) — linear postgain of the distortion

## cut
Tags: superdough

In the style of classic drum-machines, cut will stop a playing sample as soon as another samples with in same cutgroup is to be played. An example would be an open hi-hat followed by a closed one, essentially muting the open.

Parameters:
- `group` (number | Pattern) — cut group number

```strudel
s("[oh hh]*4").cut(1)
```

## cyclesPer
Tags: temporal

A pattern measuring the duration of events,
in cycles per event. cyclesPer doesn't have structure itself, but takes structure, and therefore
event durations, from the pattern that it is combined with.
For example cyclesPer.struct("1 1 [1 1] 1") would give the same as "0.25 0.25 [0.125 0.125] 0.25".
See also its reciprocal, per, also known as perCycle.

```strudel
// Shorter events are lower in pitch
sound("saw saw [saw saw] saw")
  .note(cyclesPer.range(50, 100))
```

```strudel
sound("bd sd [bd bd] sd*4 [- sd] [bd [bd bd]]")
  .note(cyclesPer.add(20))
```

## decay
Synonyms: dec
Tags: amplitude, envelope, superdough

Amplitude envelope decay time: the time it takes after the attack time to reach the sustain level.
Note that the decay is only audible if the sustain value is lower than 1.

Parameters:
- `time` (number | Pattern) — decay time in seconds

```strudel
note("c3 e3 f3 g3").decay("<.1 .2 .3 .4>").sustain(0)
```

## defaultmidimap
Tags: external_io, midi

configures the default midimap, which is used when no "midimap" port is set

```strudel
defaultmidimap({ lpf: 74 })
$: note("c a f e").midi();
$: lpf(sine.slow(4).segment(16)).midi();
```

## defragmentHaps
Tags: internals

Combines adjacent haps with the same value and whole.  Only
intended for use in tests.

## degrade
Tags: temporal

Randomly removes 50% of events from the pattern. Shorthand for .degradeBy(0.5)

```strudel
s("hh*8").degrade()
```

```strudel
s("[hh?]*8")
```

## degradeBy
Tags: temporal

Randomly removes events from the pattern by a given amount.
0 = 0% chance of removal
1 = 100% chance of removal

Parameters:
- `amount` (number) — a number between 0 and 1

```strudel
s("hh*8").degradeBy(0.2)
```

```strudel
s("[hh?0.2]*8")
```

```strudel
//beat generator
s("bd").segment(16).degradeBy(.5).ribbon(16,1)
```

## delay
Tags: orbit, superdough

Sets the level of the delay signal.

When using mininotation, you can also optionally add the 'delaytime' and 'delayfeedback' parameter,
separated by ':'.

Parameters:
- `level` (number | Pattern) — between 0 and 1

```strudel
s("bd bd").delay("<0 .25 .5 1>")
```

```strudel
s("bd bd").delay("0.65:0.25:0.9 0.65:0.125:0.7")
```

## delayfeedback
Synonyms: delayfb, dfb
Tags: orbit, superdough

Sets the level of the signal that is fed back into the delay.
Caution: Values >= 1 will result in a signal that gets louder and louder! Don't do it

Parameters:
- `feedback` (number | Pattern) — between 0 and 1

```strudel
s("bd").delay(.25).delayfeedback("<.25 .5 .75 1>")
```

## delaysync
Synonyms: delays, ds
Tags: orbit, superdough

Sets the time of the delay effect in cycles.

Parameters:
- `cycles` (number | Pattern) — delay length in cycles

```strudel
s("bd bd").delay(.25).delaysync("<1 2 3 5>".div(8))
```

## delaytime
Synonyms: delayt, dt
Tags: orbit, superdough

Sets the time of the delay effect in seconds.

Parameters:
- `delay` (number | Pattern) — in seconds

```strudel
note("d d a# a".fast(2))
.s("sawtooth")
.delay(.8)
.delaytime(1/2)
.delayspeed("<2 .5 -1 -2>")
```

## density
Tags: superdough

crackle noise density

Parameters:
- `density` (number | Pattern) — between 0 and x

```strudel
s("crackle*4").density("<0.01 0.04 0.2 0.5>".slow(4))
```

## detune
Synonyms: det
Tags: pitch, superdough

Set detune for stacked voices of supported oscillators.

Parameters:
- `amount` (number | Pattern)

```strudel
note("d f a a# a d3").fast(2).s("supersaw").detune("<.1 .2 .5 24.1>")
```

## dictionary
Tags: tonal

Which dictionary to use for the voicings. This falls back to the default dictionary if not provided

Parameters:
- `dictionaryName` (string) — which dictionary (having been defined with addVoicings) to use

```strudel
addVoicings('house', {
'': ['7 12 16', '0 7 16', '4 7 12'],
'm': ['0 3 7']
})
chord("<Am C D F Am E Am E>")
.dict('house').anchor(66)
.voicing().room(.5)
```

## diode
Tags: distortion, superdough

Diode-emulating distortion

Parameters:
- `distortion` (number | Pattern) — amount of distortion to apply
- `volume` (number | Pattern) — linear postgain of the distortion

## discreteOnly
Tags: internals

Returns a new pattern, with 'continuous' haps (those without 'whole'
timespans) removed from query results.

## distort
Synonyms: dist
Tags: distortion, superdough

Wave shaping distortion. CAUTION: it can get loud.
Second option in optional array syntax (ex: ".9:.5") applies a postgain to the output. Third option sets the waveshaping type.
Most useful values are usually between 0 and 10 (depending on source gain). If you are feeling adventurous, you can turn it up to 11 and beyond ;)

Parameters:
- `distortion` (number | Pattern) — amount of distortion to apply
- `volume` (number | Pattern) — linear postgain of the distortion
- `type` (number | string | Pattern) — type of distortion to apply

```strudel
s("bd sd [~ bd] sd,hh*8").distort("<0 2 3 10:.5>")
```

```strudel
note("d1!8").s("sine").penv(36).pdecay(.12).decay(.23).distort("8:.4")
```

```strudel
s("bd:4*4").bank("tr808").distort("3:0.5:diode")
```

## distorttype
Synonyms: disttype
Tags: distortion, superdough

Type of waveshaping distortion to apply.

Parameters:
- `type` (number | string | Pattern) — type of distortion to apply

```strudel
s("bd*4").bank("tr909").distort(2).distorttype("<0 1 2>")
```

```strudel
s("sine").note("F1*2").release(1)
  .penv(24).pdecay(0.05)
  .distort(rand.range(1, 8))
  .distorttype("<fold chebyshev scurve diode asym sinefold>")
```

## distortvol
Synonyms: distortion, distvol
Tags: superdough

Postgain for waveshaping distortion.

Parameters:
- `volume` (number | Pattern) — linear postgain of the distortion

```strudel
s("bd*4").bank("tr909").distort(2).distortvol(0.8)
```

## div
Tags: math

Divides each number by the given factor.

## djf
Tags: filter, superdough

DJ filter, below 0.5 is low pass filter, above is high pass filter.

Parameters:
- `cutoff` (number | Pattern) — below 0.5 is low pass filter, above is high pass filter

```strudel
n(irand(16).seg(8)).scale("d:phrygian").s("supersaw").djf("<.5 .3 .2 .75>")
```

## drawLine
Tags: visualization

Intended for a debugging, drawLine renders the pattern as a string, where each character represents the same time span.
Should only be used with single characters as values, otherwise the character slots will be messed up.
Character legend:

"|" cycle separator
"-" hold previous value
"." silence

Parameters:
- `pattern` (Pattern) — the pattern to use
- `chars` (number) — max number of characters (approximately)

```strudel
const line = drawLine("0 [1 2 3]", 10); // |0--123|0--123
console.log(line);
silence;
```

## drive
Tags: filter, superdough

Filter overdrive for supported filter types

Parameters:
- `amount` (number | Pattern)

```strudel
note("{f g g c d a a#}%16".sub(17)).s("supersaw").lpenv(8).lpf(150).lpq(.8).ftype('ladder').drive("<.5 4>")
```

## drop
Tags: stepwise

Experimental

Drops the given number of steps from a pattern.
A positive number will drop steps from the start of a pattern, and a negative number from the end.

```strudel
"tha dhi thom nam".drop("1").sound().bank("mridangam")
```

```strudel
"tha dhi thom nam".drop("-1").sound().bank("mridangam")
```

```strudel
"tha dhi thom nam".drop("0 1 2 3").sound().bank("mridangam")
```

```strudel
"tha dhi thom nam".drop("0 -1 -2 -3").sound().bank("mridangam")
```

## duckattack
Synonyms: duckatt, datt
Tags: amplitude, envelope, orbit, superdough

The time required for the ducked signal(s) to return to their normal volume.

Can vary across orbits with the ':' mininotation, e.g. duckonset("0:0.003").
Note: this requires first applying the effect to multiple orbits with e.g. duckorbit("2:3").

Parameters:
- `time` (number | Pattern) — The attack time in seconds

```strudel
sound: n(run(8)).scale("c:minor").s("sawtooth").delay(.7).orbit(2)
ducker: s("bd:4!4").beat("0,4,8,11,14",16).duckorbit(2).duckattack("<0.2 0 0.4>").duckdepth(1)
```

```strudel
moreduck: n(run(8)).scale("c:minor").s("sawtooth").delay(.7).orbit(2)
lessduck: s("hh*16").orbit(5)
ducker: s("bd:4!4").beat("0,4,8,11,14",16).duckorbit("2:5").duckattack("0.4:0.1")
```

## duckdepth
Tags: amplitude, orbit, superdough

The amount of ducking applied to target orbit

Can vary across orbits with the ':' mininotation, e.g. duckdepth("0.3:0.1").
Note: this requires first applying the effect to multiple orbits with e.g. duckorbit("2:3").

Parameters:
- `depth` (number | Pattern) — depth of modulation from 0 to 1

```strudel
stack( n(run(8)).scale("c:minor").s("sawtooth").delay(.7).orbit(2), s("bd:4!4").beat("0,4,8,11,14",16).duckorbit(2).duckattack(0.2).duckdepth("<1 .9 .6 0>"))
```

```strudel
$: n(run(16)).scale("c:minor:pentatonic").s("sawtooth").delay(.7).orbit(2)
$: s("hh*16").orbit(3)
$: s("bd:4!4").beat("0,4,8,11,14",16).duckorbit("2:3").duckattack(0.2).duckdepth("1:0.5")
```

## duckonset
Synonyms: duckons
Tags: amplitude, envelope, orbit, superdough

The time required for the ducked signal(s) to reach their lowest volume.
Can be used to prevent clicking or for creative rhythmic effects.

Can vary across orbits with the ':' mininotation, e.g. duckonset("0:0.003").
Note: this requires first applying the effect to multiple orbits with e.g. duckorbit("2:3").

Parameters:
- `time` (number | Pattern) — The onset time in seconds

```strudel
// Clicks
sound: freq("63.2388").s("sine").orbit(2).gain(4)
duckerWithClick: s("bd*4").duckorbit(2).duckattack(0.3).duckonset(0).postgain(0)
```

```strudel
// No clicks
sound: freq("63.2388").s("sine").orbit(2).gain(4)
duckerWithoutClick: s("bd*4").duckorbit(2).duckattack(0.3).duckonset(0.01).postgain(0)
```

```strudel
// Rhythmic
noise: s("pink").distort("2:1").orbit(4) // used rhythmically with 0.3 onset below
hhat: s("hh*16").orbit(7)
ducker: s("bd*4").bank("tr909").duckorbit("4:7").duckonset("0.3:0.003").duckattack(0.25)
```

## duckorbit
Synonyms: duck
Tags: amplitude, orbit, superdough

Modulate the amplitude of an orbit to create a "sidechain" like effect.

Can be applied to multiple orbits with the ':' mininotation, e.g. duckorbit("2:3")

Parameters:
- `orbit` (number | Pattern) — target orbit

```strudel
$: n(run(16)).scale("c:minor:pentatonic").s("sawtooth").delay(.7).orbit(2)
$: s("bd:4!4").beat("0,4,8,11,14",16).duckorbit(2).duckattack(0.2).duckdepth(1)
```

```strudel
$: n(run(16)).scale("c:minor:pentatonic").s("sawtooth").delay(.7).orbit(2)
$: s("hh*16").orbit(3)
$: s("bd:4!4").beat("0,4,8,11,14",16).duckorbit("2:3").duckattack(0.2).duckdepth(1)
```

## duration
Synonyms: dur
Tags: superdough

Sets the duration of the event in cycles. Similar to clip / legato, it also cuts samples off at the end if they exceed the duration.

Parameters:
- `seconds` (number | Pattern) — = 0

```strudel
note("c a f e").s("piano").dur("<.5 1 2>")
```

## each
Tags: combiners

Applies a function to each of the running patterns separately. This is intended for future use with upcoming 'stepwise' features. See all for a version that applies the function to all the patterns stacked together into a single pattern.

Note: Patterns must be labeled (e.g. with $:) to be picked up by each. An unlabeled
pattern such as note("c4") is not registered and will produce no audio when each is present.
Use $: note("c4") instead.

$: sound("bd - cp sd")
$: sound("hh*8")
each(fast("<2 3>"))

## early
Tags: temporal

Nudge a pattern to start earlier in time. Equivalent of Tidal's <~ operator

Parameters:
- `cycles` (number | Pattern) — number of cycles to nudge left

```strudel
"bd ~".stack("hh ~".early(.1)).s()
```

## echo
Tags: temporal

Superimpose and offset multiple times, gradually decreasing the velocity

Parameters:
- `times` (number) — how many times to repeat
- `time` (number) — cycle offset between iterations
- `feedback` (number) — velocity multiplicator for each iteration

```strudel
s("bd sd").echo(3, 1/6, .8)
```

## echoWith
Synonyms: echowith, stutWith, stutwith
Tags: temporal, functional

Superimpose and offset multiple times, applying the given function each time.

Parameters:
- `times` (number) — how many times to repeat
- `time` (number) — cycle offset between iterations
- `func` (function) — function to apply, given the pattern and the iteration index

```strudel
"<0 [2 4]>"
.echoWith(4, 1/8, (p,n) => p.add(n*2))
.scale("C:minor").note()
```

## edoScale

Turns numbers into notes in the given EDO scale (zero indexed).

An EDO scale definition looks like this:

e.g. C:LLsLLLs:2:1 <- this is the C major scale, 12 EDO

e.g. C:LLsLLL:3:1 <- this is the Gorgo 6 note scale, 16 EDO

An EDO scale, e.g. C:LLsLLLs:2:1, consists of a root note (e.g. C)
followed by semicolon (':')
and then a Large/small step notation sequence
(e.g. LLsLLLs)
followed by semicolon, then the large step size (e.g. 2)
followed by semicolon, then the small step size (e.g. 1).

The number of divisions of the octave is calculated as the sum
of the steps in the EDO scale definition.

e.g. C:LLsLLLs:2:1 is 2+2+1+2+2+2+1 = 12 EDO, 7 note scale

e.g. C:LLsLLL:3:1 is 3+3+1+3+3+3 = 16 EDO, 6 note scale

The root note defaults to octave 3, if no octave number is given.

Parameters:
- `scale` (string) — Definition of EDO scale.

```strudel
n("0 2 4 6 4 2").edoScale("C:LLsLLLs:2:1")
```

```strudel
n("[0,7] 4 [2,7] 4")
.edoScale("G2:<LLsLLL LLLLsL>:3:1")
.s("piano")._pitchwheel()
```

```strudel
n(rand.range(0,5).segment(6))
.edoScale("<G2 C3>:LLsLL:3:1")
.s("piano")._pitchwheel()
```

## end
Tags: samples

The same as .begin, but cuts off the end off each sample.

Parameters:
- `length` (number | Pattern) — 1 = whole sample, .5 = half sample, .25 = quarter sample etc..

```strudel
s("bd*2,oh*4").end("<.1 .2 .5 1>").fast(2)
```

## env
Tags: envelope, superdough

Configures an envelope. Can be called in sequence like pat.env(...).env(...) to set up multiple envelopes
There are two ways to declare which control will be modulated:

Explicitly put control in the config (e.g. env({ c: "lpf" }))
If the control parameter is absent, the control immediately before the env call will be used
(e.g. s("saw").lpf(500).env({ a: 1 }) to modulate lpf)

Modulators can be referred to by id so that they can be updated later e.g. inside
a sometimes. See example below.

Parameters:
- `config` (Object) — Envelope configuration.
- `config.control` (string | Pattern) — Node to modulate. Aliases: c
- `config.subControl` (string | Pattern) — Sub-control name to append to the control key. Aliases: sc
- `config.depth` (number | Pattern) — Relative modulation depth. Aliases: dep, dr
- `config.depthabs` (number | Pattern) — Absolute modulation depth. Aliases: da
- `config.attack` (number | Pattern) — Time to reach depth. Aliases: att, a
- `config.decay` (number | Pattern) — Time to reach sustain. Aliases: dec, d
- `config.sustain` (number | Pattern) — Sustain depth. Aliases: sus, s
- `config.release` (number | Pattern) — Time to return to nominal value. Aliases: rel, r
- `config.acurve` (number | Pattern) — Snappiness of attack curve (-1 = relaxed, 1 = snappy). Aliases: ac
- `config.dcurve` (number | Pattern) — Snappiness of decay curve (-1 = relaxed, 1 = snappy). Aliases: dc
- `config.rcurve` (number | Pattern) — Snappiness of release curve (-1 = relaxed, 1 = snappy). Aliases: rc
- `config.fxi` (number | Pattern) — FX index to target
- `id` (string | Pattern) — ID to use for this modulator

```strudel
s("saw").note("F1").lpf(500).env({ a: 1 })
```

```strudel
s("saw").env({ d: 1 }).note("F1")
  .lpq(4).lpf(50)
  .env({ a: 0.1, d: 1, ac: 0.8, dc: 0.3, depth: 50 })
```

```strudel
s("saw").lpf(500).diode(0.3)
  .env({ c: "lpf", a: 0.5, d: 0.5 })
```

```strudel
s("pulse").lpf(500).env({ a: 1 })
  .env({ c: "s", a: 1 })
  .diode(0.3)
  .sometimes(x => x.env({ a: "0.5" }, 1)) // envelope #1 (0-indexed)
```

```strudel
s("pulse").lpf(500).env({ a: 1 }, 'lpf_mod')
  .env({ c: "s", a: 1 })
  .diode(0.3)
  .sometimes(x => x.env({ a: "0.5" }, 'lpf_mod'))
```

## euclid
Tags: temporal

Changes the structure of the pattern to form an Euclidean rhythm.
Euclidean rhythms are rhythms obtained using the greatest common
divisor of two numbers.  They were described in 2004 by Godfried
Toussaint, a Canadian computer scientist.  Euclidean rhythms are
really useful for computer/algorithmic music because they can
describe a large number of rhythms with a couple of numbers.

Parameters:
- `pulses` (number) — the number of onsets/beats
- `steps` (number) — the number of steps to fill

```strudel
// The Cuban tresillo pattern.
note("c3").euclid(3,8)
```

## euclidish
Synonyms: eish
Tags: temporal

A 'euclid' variant with an additional parameter that morphs the resulting
rhythm from 0 (no morphing) to 1 (completely 'even'). For example
sound("bd").euclidish(3,8,0) would be the same as
sound("bd").euclid(3,8), and sound("bd").euclidish(3,8,1) would be the
same as sound("bd bd bd"). sound("bd").euclidish(3,8,0.5) would have a
groove somewhere between.
Inspired by the work of Malcom Braff.

Parameters:
- `pulses` (number) — the number of onsets
- `steps` (number) — the number of steps to fill
- `groove` (number) — exists between the extremes of 0 (straight euclidian) and 1 (straight pulse)

```strudel
sound("hh").euclidish(7,12,sine.slow(8))
.pan(sine.slow(8))
```

## euclidLegato
Tags: temporal

Similar to euclid, but each pulse is held until the next pulse,
so there will be no gaps.

Parameters:
- `pulses` (number) — the number of onsets/beats
- `steps` (number) — the number of steps to fill
- `rotation` () — offset in steps
- `pat` ()

```strudel
note("c3").euclidLegato(3,8)
```

## euclidLegatoRot
Tags: temporal

Similar to euclid, but each pulse is held until the next pulse,
so there will be no gaps, and has an additional parameter for 'rotating'
the resulting sequence

Parameters:
- `pulses` (number) — the number of onsets/beats
- `steps` (number) — the number of steps to fill
- `rotation` (number) — offset in steps

```strudel
note("c3").euclidLegatoRot(3,5,2)
```

## euclidRot
Tags: temporal

Like euclid, but has an additional parameter for 'rotating' the resulting sequence.

Parameters:
- `pulses` (number) — the number of onsets/beats
- `steps` (number) — the number of steps to fill
- `rotation` (number) — offset in steps

```strudel
// A Samba rhythm necklace from Brazil
note("c3").euclidRot(3,16,14)
```

## every
Tags: temporal

An alias for firstOf

Parameters:
- `n` (number) — how many cycles
- `func` (function) — function to apply

```strudel
note("c3 d3 e3 g3").every(4, x=>x.rev())
```

## expand
Tags: stepwise

Experimental

Expands the step size of the pattern by the given factor.

```strudel
sound("tha dhi thom nam").bank("mridangam").expand("3 2 1 1 2 3").pace(8)
```

## extend
Tags: stepwise

Experimental

extend is similar to fast in that it increases its density, but it also increases the step count
accordingly. So stepcat("a b".extend(2), "c d") would be the same as "a b a b c d", whereas
stepcat("a b".fast(2), "c d") would be the same as "[a b] [a b] c d".

```strudel
stepcat(
  sound("bd bd - cp").extend(2),
  sound("bd - sd -")
).pace(8)
```

## fanchor
Tags: filter, envelope, superdough

controls the center of the filter envelope. 0 is unipolar positive, .5 is bipolar, 1 is unipolar negative

Parameters:
- `center` (number | Pattern) — 0 to 1

```strudel
note("{f g g c d a a#}%8").s("sawtooth").lpf("{1000}%2")
.lpenv(8).fanchor("<0 .5 1>")
```

## fast
Synonyms: density
Tags: temporal

Speed up a pattern by the given factor. Used by "*" in mini notation.

Parameters:
- `factor` (number | Pattern) — speed up factor

```strudel
s("bd hh sd hh").fast(2) // s("[bd hh sd hh]*2")
```

## fastChunk
Synonyms: fastchunk
Tags: temporal

Like chunk, but the cycles of the source pattern aren't repeated
for each set of chunks.

```strudel
"<0 8> 1 2 3 4 5 6 7"
.scale("C2:major").note()
.fastChunk(4, x => x.color('red')).slow(2)
```

## fastGap
Synonyms: fastgap
Tags: temporal

speeds up a pattern like fast, but rather than it playing multiple times as fast would it instead leaves a gap in the remaining space of the cycle. For example, the following will play the sound pattern "bd sn" only once but compressed into the first half of the cycle, i.e. twice as fast.

```strudel
s("bd sd").fastGap(2)
```

## filter
Tags: temporal, functional

Filters haps using the given function

Parameters:
- `test` (function) — function to test Hap

```strudel
s("hh!7 oh").filter(hap => hap.value.s === 'hh')
```

## filterHaps
Tags: internals

Returns a new Pattern, which only returns haps that meet the given test.

Parameters:
- `hap_test` (function) — a function which returns false for haps to be removed from the pattern

```strudel
s("bd*8").velocity(rand).filterHaps((h) => (h.whole.begin % 1) < h.value.velocity)
```

## filterValues
Tags: internals

As with filterHaps, but the function is applied to values
inside haps.

Parameters:
- `value_test` (function)

```strudel
const drums = s("bd sd bd sd")
kick: drums.filterValues((v) => v.s === 'bd').duck(2)
snare: drums.filterValues((v) => v.s === 'sd')
bass: s("saw!4").note("G#1").lpf(80).lpenv(4).orbit(2)
```

## filterWhen
Tags: temporal, functional

Filters haps by their begin time

Parameters:
- `test` (function) — function to test Hap.whole.begin

```strudel
oneCycle: s("bd*4").filterWhen((t) => t < 1)
```

## findPeaks
Tags: internals

Find peaks in spectrum magnitudes

## firstCycle
Tags: internals

Queries the pattern for the first cycle, returning Haps. Mainly of use when
debugging a pattern.

Parameters:
- `with_context` (Boolean) — set to true, otherwise the context field
will be stripped from the resulting haps.

## firstCycleValues
Tags: internals

Accessor for a list of values returned by querying the first cycle.

## firstOf
Tags: temporal

Applies the given function every n cycles, starting from the first cycle.

Parameters:
- `n` (number) — how many cycles
- `func` (function) — function to apply

```strudel
note("c3 d3 e3 g3").firstOf(4, x=>x.rev())
```

## fit
Tags: samples, pitch

Makes the sample fit its event duration. Good for rhythmical loops like drum breaks.
Similar to loopAt.

```strudel
samples({ rhodes: 'https://cdn.freesound.org/previews/132/132051_316502-lq.mp3' })
s("rhodes/2").fit()
```

## floor
Tags: math

Assumes a numerical pattern. Returns a new pattern with all values set to
their mathematical floor. E.g. 3.7 replaced with to 3, and -4.2
replaced with -5.

```strudel
note("42 42.1 42.5 43".floor())
```

## fmap

see withValue

## fmattack
Synonyms: fmatt
Tags: fm, envelope, superdough

Attack time for the FM envelope: time it takes to reach maximum modulation

A number may be added afterwards to control the attack of the envelope of
any of the 8 individual FMs (e.g. fmatt5)

Parameters:
- `time` (number | Pattern) — attack time

```strudel
note("c e g b g e")
.fm(4)
.fmattack("<0 .05 .1 .2>")
._scope()
```

## fmdecay
Synonyms: fmdec
Tags: fm, envelope, superdough

Decay time for the FM envelope: seconds until the sustain level is reached after the attack phase.

A number may be added afterwards to control the decay of the envelope of
any of the 8 individual FMs (e.g. fmdec6)

Parameters:
- `time` (number | Pattern) — decay time

```strudel
note("c e g b g e")
.fm(4)
.fmdecay("<.01 .05 .1 .2>")
.fmsustain(.4)
._scope()
```

## fmenv
Synonyms: fme
Tags: fm, envelope, superdough

Ramp type of fm envelope. Exp might be a bit broken..

A number may be added afterwards to control the envelope of
any of the 8 individual FMs (e.g. fmenv4)

Parameters:
- `type` (number | Pattern) — lin | exp

```strudel
note("c e g b g e")
.fm(4)
.fmdecay(.2)
.fmsustain(0)
.fmenv("<exp lin>")
._scope()
```

## fmh
Tags: fm, superdough

Sets the Frequency Modulation Harmonicity Ratio.
Controls the timbre of the sound.
Whole numbers and simple ratios sound more natural,
while decimal numbers and complex ratios sound metallic.

A number may be added afterwards to control the harmonicity of
any of the 8 individual FMs (e.g. fmh2)

Parameters:
- `harmonicity` (number | Pattern)

```strudel
note("c e g b g e")
.fm(4)
.fmh("<1 2 1.5 1.61>")
._scope()
```

## fmi
Synonyms: fm
Tags: fm, superdough

Sets the Frequency Modulation of the synth.
Controls the modulation index, which defines the brightness of the sound.

A number may be added afterwards to control the modulation index of
any of the 8 individual FMs (e.g. fm3). Also, FMs may be routed into
each other with matrix commands like fm13, which would send fm1 back into
fm3

Parameters:
- `brightness` (number | Pattern) — modulation index

```strudel
note("c e g b g e")
.fm("<0 1 2 8 32>")
._scope()
```

```strudel
s("sine").note("F1").seg(8)
 .fm(4).fm2(rand.mul(4)).fm3(saw.mul(8).slow(8))
 .fmh(1.06).fmh2(10).fmh3(0.1)
```

## fmrelease
Synonyms: fmrel
Tags: fm, envelope, superdough

Release time for the FM envelope: how much modulation is applied after the note is released

A number may be added afterwards to control the release of the envelope of
any of the 8 individual FMs (e.g. fmrel8)

Parameters:
- `time` (number | Pattern) — release time

## fmsustain
Synonyms: fmsus
Tags: fm, envelope, superdough

Sustain level for the FM envelope: how much modulation is applied after the decay phase

A number may be added afterwards to control the sustain of the envelope of
any of the 8 individual FMs (e.g. fmsus7)

Parameters:
- `level` (number | Pattern) — sustain level

```strudel
note("c e g b g e")
.fm(4)
.fmdecay(.1)
.fmsustain("<1 .75 .5 0>")
._scope()
```

## fmwave
Tags: fm, superdough

Waveform of the fm modulator

A number may be added afterwards to control the waveform
any of the 8 individual FMs (e.g. fmwave6)

Parameters:
- `wave` (number | Pattern) — waveform

```strudel
n("0 1 2 3".fast(4)).scale("d:minor").s("sine").fmwave("<sine square sawtooth crackle>").fm(4).fmh(2.01)
```

```strudel
n("0 1 2 3".fast(4)).chord("<Dm Am F G>").voicing().s("sawtooth").fmwave("brown").fm(.6)
```

## focus
Tags: temporal

Similar to compress, but doesn't leave gaps, and the 'focus' can be bigger than a cycle

```strudel
s("bd hh sd hh").focus(1/4, 3/4)
```

## fold
Tags: distortion, superdough

Wavefolding distortion

Parameters:
- `distortion` (number | Pattern) — amount of distortion to apply
- `volume` (number | Pattern) — linear postgain of the distortion

## freq
Tags: pitch, superdough

Set frequency of sound.

Parameters:
- `frequency` (number | Pattern) — in Hz. the audible range is between 20 and 20000 Hz

```strudel
freq("220 110 440 110").s("superzow").osc()
```

```strudel
freq("110".mul.out(".5 1.5 .6 [2 3]")).s("superzow").osc()
```

## fromBipolar
Tags: math

Assumes a numerical pattern, containing bipolar values in the range -1 .. 1
Returns a new pattern with values scaled to the unipolar range 0 .. 1

## fscope
Tags: visualization

Renders an oscilloscope for the frequency domain of the audio signal.

Parameters:
- `color` (string) — line color as hex or color name. defaults to white.
- `scale` (number) — scales the y-axis. Defaults to 0.25
- `pos` (number) — y-position relative to screen height. 0 = top, 1 = bottom of screen
- `lean` (number) — y-axis alignment where 0 = top and 1 = bottom
- `min` (number) — min value
- `max` (number) — max value

```strudel
s("sawtooth").fscope()
```

## ftranspose
Synonyms: ftrans, fTrans, ftranspose, fTranspose
Tags: tonal

Frequency transpose. Assumes pattern either has freq set, or has values that can be interpreted as frequencies
amt has optional edoSize param, defaults to 12.
If haps have edoSize param set, such as from the output of xen("31edo"),
ftrans will fallback to that instead of 12 as the default.

Transposes the frequency by amt edoSteps

Parameters:
- `amt` (number)
- `edoSize` (number) — (optional)

```strudel
i("0 1 2").xen("12edo").ftrans("7")
// n("0 1 2").scale("A:chromatic").trans("7")
```

```strudel
i("0 8 18").xen("31edo").ftrans("<8 -8>")
```

```strudel
// to transpose by steps of an edo, use "step:edo" :
i("0 7 8 18").xen("31edo").ftrans("<0 1:31 1:12>")
```

```strudel
// it can also work with frequency values directly
freq("200 300 400").ftrans("<0 7:31 7>")
```

## ftype
Tags: filter, superdough

Sets the filter type. The ladder filter is more aggressive. More types might be added in the future.

Parameters:
- `type` (number | Pattern) — 12db (0), ladder (1), or 24db (2)

```strudel
note("{f g g c d a a#}%8").s("sawtooth").lpenv(4).lpf(500).ftype("<0 1 2>").lpq(1)
```

```strudel
note("c f g g a c d4").fast(2)
.sound('sawtooth')
.lpf(200).fanchor(0)
.lpenv(3).lpq(1)
.ftype("<ladder 12db 24db>")
```

## FX
Tags: superdough

Establishes an FX chain. Can be called by chaining .FX(fx1).FX(fx2)..
calls and/or in a single .FX(fx1, fx2, ..) call. The fx1, .. are patterns which
establish the controls of the given effect. See examples.

```strudel
$: s("[sbd <hh [bd | lt | oh]>]*4").dec(.4)
  .FX(
    phaser(0.5).gain(2),
    bpf(800),
    distort(1.3),
    room(0.2),
    delay(0.5).gain(1.25),
    distort(0.3),
  ).fxr(1.7) // sets release time of effects (like delay)
```

```strudel
$: s("saw").fm(0.5)
  .delay(0.3) // outer effects are applied *last*
  .FX(coarse(4)) // first coarse
  .FX(lpf(500).lpe(4).lpa(1).lpd(2)) // then lpf
  .FX(distort(1)) // then distort
```

## gain
Tags: amplitude, superdough

Controls the gain by an exponential amount.

Parameters:
- `amount` (number | Pattern) — gain.

```strudel
s("hh*8").gain(".4!2 1 .4!2 1 .4 1").fast(2)
```

## gap
Tags: generators

Does absolutely nothing, but with a given metrical 'steps'

Parameters:
- `steps` (number)

```strudel
gap(3) // "~@3"
```

## generateGraph
Tags: internals

Creates a canvas element showing a graph of the given data.

Parameters:
- `data` (Float32Array) — An array of numbers, or a Float32Array.
- `width` (number) — Width in pixels of the canvas.
- `height` (number) — Height in pixels of the canvas.
- `min` (number) — Minimum value of data for the graph (lower edge).
- `max` (number) — Maximum value of data in the graph (upper edge).

## generateReverb
Tags: internals

Generates a reverb impulse response.

Parameters:
- `params` (Object) — TODO: Document the properties.
- `callback` (function) — Function to call when
the impulse response has been generated. The impulse response
is passed to this function as its parameter. May be called
immediately within the current execution context, or later.

## getDevice

Look up a device by index or name. Otherwise return a default device, or fail if none are connected.

Parameters:
- `indexOrName` (string | number)
- `devices` (Array.<Input> | Array.<Output>)

## getDur
Tags: samples

Returns the duration, in seconds, of the given sample.
Has optional param n (for instance, the 2 in s("casio:2"))

Note: must be called with await, otherwise you'll get a pending Promise object.

Parameters:
- `sampleName` (string)
- `(optional)` (number) — n

```strudel
// Set a patterns cycle length to exactly the length of the sample
samples('github:tidalcycles/dirt-samples')
let k = await getDuration('sax')
s("sax").cps(1/k)
```

## getMidiDeviceNamesString

Get a string listing device names for error messages.

Parameters:
- `devices` (Array.<Input> | Array.<Output>)

## gravityX
Synonyms: gravX
Tags: external_io

The device's gravity x-axis value ranges from 0 to 1.

```strudel
n(gravityX.segment(4).range(0,7)).scale("C:minor")
```

## gravityY
Synonyms: gravY
Tags: external_io

The device's gravity y-axis value ranges from 0 to 1.

```strudel
n(gravityY.segment(4).range(0,7)).scale("C:minor")
```

## gravityZ
Synonyms: gravZ
Tags: external_io

The device's gravity z-axis value ranges from 0 to 1.

```strudel
n(gravityZ.segment(4).range(0,7)).scale("C:minor")
```

## grow
Tags: stepwise

Experimental

Progressively grows the pattern by 'n' steps until the full pattern is played, or if a second value is given (using mininotation list syntax with :),
that number of times.
A positive number will progressively grow steps from the start of a pattern, and a negative number from the end.

```strudel
"tha dhi thom nam".grow("1").sound()
.bank("mridangam")
```

```strudel
"tha dhi thom nam".grow("-1").sound()
.bank("mridangam")
```

```strudel
"tha dhi thom nam".grow("1 -1").sound().bank("mridangam").pace(4)
```

```strudel
note("0 1 2 3 4 5 6 7".scale("C:ritusen")).sound("folkharp")
   .grow("1 -1").pace(8)
```

## handleOutputBuffersToRetrieve
Tags: internals

Add contents of output buffers just processed to output buffers

## hard
Tags: distortion, superdough

Hard-clipping distortion

Parameters:
- `distortion` (number | Pattern) — amount of distortion to apply
- `volume` (number | Pattern) — linear postgain of the distortion

## hpattack
Synonyms: hpa
Tags: filter, envelope, superdough

Sets the attack duration for the highpass filter envelope.

Parameters:
- `attack` (number | Pattern) — time of the highpass filter envelope

```strudel
note("c2 e2 f2 g2")
.sound('sawtooth')
.hpf(500)
.hpa("<.5 .25 .1 .01>/4")
.hpenv(4)
```

## hpdc
Tags: filter, lfo, superdough

DC offset of the LFO for the highpass filter

Parameters:
- `dcoffset` (number | Pattern) — dc offset. set to 0 for unipolar

## hpdecay
Synonyms: hpd
Tags: filter, envelope, superdough

Sets the decay duration for the highpass filter envelope.

Parameters:
- `decay` (number | Pattern) — time of the highpass filter envelope

```strudel
note("c2 e2 f2 g2")
.sound('sawtooth')
.hpf(500)
.hpd("<.5 .25 .1 0>/4")
.hps(0.2)
.hpenv(4)
```

## hpdepth
Tags: filter, lfo, superdough

Depth of the LFO for the highpass filter

Parameters:
- `depth` (number | Pattern) — depth of modulation

## hpdepthfrequency
Synonyms: hpdepthfreq
Tags: filter, lfo, superdough

Depth of the LFO for the hipass filter, in hz

Parameters:
- `depth` (number | Pattern) — depth of modulation

```strudel
note("<c c c# c c c4>*16").s("sawtooth").lpf(600).hpdepthfrequency("<200 500 100 0>")
```

## hpenv
Synonyms: hpe
Tags: filter, envelope, superdough

Sets the highpass filter envelope modulation depth.

Parameters:
- `modulation` (number | Pattern) — depth of the highpass filter envelope between 0 and n

```strudel
note("c2 e2 f2 g2")
.sound('sawtooth')
.hpf(500)
.hpa(.5)
.hpenv("<4 2 1 0 -1 -2 -4>/4")
```

## hpf
Synonyms: hp, hcutoff
Tags: filter, superdough

Applies the cutoff frequency of the high-pass filter.

When using mininotation, you can also optionally add the 'hpq' parameter, separated by ':'.

Parameters:
- `frequency` (number | Pattern) — audible between 0 and 20000

```strudel
s("bd sd [~ bd] sd,hh*8").hpf("<4000 2000 1000 500 200 100>")
```

```strudel
s("bd sd [~ bd] sd,hh*8").hpf("<2000 2000:25>")
```

## hpq
Synonyms: hresonance
Tags: filter, superdough

Controls the high-pass q-value.

Parameters:
- `q` (number | Pattern) — resonance factor between 0 and 50

```strudel
s("bd sd [~ bd] sd,hh*8").hpf(2000).hpq("<0 10 20 30>")
```

## hprate
Tags: filter, lfo, superdough

Rate of the LFO for the highpass filter

Parameters:
- `rate` (number | Pattern) — rate in hertz

## hprelease
Synonyms: hpr
Tags: filter, envelope, superdough

Sets the release time for the highpass filter envelope.

Parameters:
- `release` (number | Pattern) — time of the highpass filter envelope

```strudel
note("c2 e2 f2 g2")
.sound('sawtooth')
.clip(.5)
.hpf(500)
.hpenv(4)
.hpr("<.5 .25 .1 0>/4")
.release(.5)
```

## hpshape
Tags: filter, lfo, superdough

Shape of the LFO for the highpass filter

Parameters:
- `shape` (number | Pattern) — Shape of the lfo (0, 1, 2, ..)

## hpskew
Tags: filter, lfo, superdough

Skew of the LFO for the highpass filter

Parameters:
- `skew` (number | Pattern) — How much to bend the LFO shape

## hpsustain
Synonyms: hps
Tags: filter, envelope, superdough

Sets the sustain amplitude for the highpass filter envelope.

Parameters:
- `sustain` (number | Pattern) — amplitude of the highpass filter envelope

```strudel
note("c2 e2 f2 g2")
.sound('sawtooth')
.hpf(500)
.hpd(.5)
.hps("<0 .25 .5 1>/4")
.hpenv(4)
```

## hpsync
Tags: filter, lfo, superdough

Cycle-synced rate of the LFO for the highpass filter

Parameters:
- `rate` (number | Pattern) — rate in cycles

## hurry
Tags: temporal

Both speeds up the pattern (like 'fast') and the sample playback (like 'speed').

```strudel
s("bd sd:2").hurry("<1 2 4 3>").slow(1.5)
```

## hush
Tags: temporal

Silences a pattern.

```strudel
stack(
  s("bd").hush(),
  s("hh*3")
)
```

## i
Tags: tonal

Selects the given degree. Currently used in xen and tune:

Parameters:
- `value` (number | Pattern)

```strudel
i("0 1 2 3 4 5 6 7").xen("<5edo 10edo 15edo hexany15>")
```

## inhabit
Synonyms: pickSqueeze
Tags: combiners

Picks patterns (or plain values) either from a list (by index) or a lookup table (by name).
Similar to pick, but cycles are squeezed into the target ('inhabited') pattern.

Parameters:
- `pat` (Pattern)
- `xs` (*)

```strudel
let a = s("bd(3,8)")
let b = s("cp sd")
"<a b [a,b]>".inhabit({ a, b })
```

```strudel
s("a@2 [a b] a"
.inhabit({a: "bd(3,8)", b: "sd sd"}))
.slow(4)
```

## inhabitmod
Synonyms: pickmodSqueeze
Tags: combiners

The same as inhabit, but if you pick a number greater than the size of the list,
it wraps around, rather than sticking at the maximum value.
For example, if you pick the fifth pattern of a list of three, you'll get the
second one.

Parameters:
- `pat` (Pattern)
- `xs` (*)

## inside
Tags: temporal

Carries out an operation 'inside' a cycle.

```strudel
"0 1 2 3 4 3 2 1".inside(4, rev).scale('C major').note()
// "0 1 2 3 4 3 2 1".slow(4).rev().fast(4).scale('C major').note()
```

## into
Tags: temporal

Breaks a pattern into pieces according to the structure of a given pattern.
True values in the given pattern cause the corresponding subcycle of the
source pattern to be looped, and for an (optional) given function to be
applied. False values result in the corresponding part of the source pattern
to be played unchanged.

```strudel
sound("bd sd ht lt").into("1 0", hurry(2))
```

## invert
Synonyms: inv
Tags: temporal

Swaps 1s and 0s in a binary pattern.

```strudel
s("bd").struct("1 0 0 1 0 0 1 0".lastOf(4, invert))
```

## irand
Tags: generators

A continuous pattern of random integers, between 0 and n-1.

Parameters:
- `n` (number) — max value (exclusive)

```strudel
// randomly select scale notes from 0 - 7 (= C to C)
n(irand(8)).struct("x x*2 x x*3").scale("C:minor")
```

## irbegin
Synonyms: ir
Tags: orbit, superdough

Sets the beginning of the IR response sample

Parameters:
- `begin` (string | Pattern) — between 0 and 1

```strudel
samples('github:switchangel/pad')
$: s("brk/2").fit().scrub(irand(16).div(16).seg(8)).ir("swpad:4").room(.65).irspeed("-2").irbegin("<0 .5 .75>/2").roomsize(.6)
```

## iresponse
Synonyms: ir
Tags: orbit, superdough

Sets the sample to use as an impulse response for the reverb.

Parameters:
- `sample` (string | Pattern) — to use as an impulse response

```strudel
s("bd sd [~ bd] sd").room(.8).ir("<shaker_large:0 shaker_large:2>")
```

## irspeed
Tags: orbit, superdough

Sets speed of the sample for the impulse response.

Parameters:
- `speed` (string | Pattern)

```strudel
samples('github:switchangel/pad')
$: s("brk/2").fit().scrub(irand(16).div(16).seg(8)).ir("swpad:4").room(.2).irspeed("<2 1 .5>/2").irbegin(.5).roomsize(.5)
```

## isaw
Tags: generators

A sawtooth signal between 1 and 0 (like saw, but flipped).

```strudel
note("<c3 [eb3,g3] g2 [g3,bb3]>*8")
.clip(isaw.slow(2))
```

```strudel
n(isaw.range(0,8).segment(8))
.scale('C major')
```

## isaw2
Tags: generators

A sawtooth signal between 1 and -1 (like saw2, but flipped).

## iter
Tags: temporal

Divides a pattern into a given number of subdivisions, plays the subdivisions in order, but increments the starting subdivision each cycle. The pattern wraps to the first subdivision after the last subdivision is played.

```strudel
note("0 1 2 3".scale('A minor')).iter(4)
```

## iterBack
Synonyms: iterback
Tags: temporal

Like iter, but plays the subdivisions in reverse order. Known as iter' in tidalcycles

```strudel
note("0 1 2 3".scale('A minor')).iterBack(4)
```

## itri
Tags: generators

An inverted triangle signal between 1 and 0 (like tri, but flipped).

```strudel
n(itri.segment(8).range(0,7)).scale("C:minor")
```

## itri2
Tags: generators

An inverted triangle signal between -1 and 1 (like itri, but bipolar).

## jux
Tags: temporal, superdough

The jux function creates strange stereo effects, by applying a function to a pattern, but only in the right-hand channel.

```strudel
s("bd lt [~ ht] mt cp ~ bd hh").jux(rev)
```

```strudel
s("bd lt [~ ht] mt cp ~ bd hh").jux(press)
```

```strudel
s("bd lt [~ ht] mt cp ~ bd hh").jux(iter(4))
```

## juxBy
Synonyms: juxby
Tags: temporal

Jux with adjustable stereo width. 0 = mono, 1 = full stereo.

```strudel
s("bd lt [~ ht] mt cp ~ bd hh").juxBy("<0 .5 1>/2", rev)
```

## juxFlip
Synonyms: juxflip, flux

Like jux, but flips the ears each cycle.

```strudel
s("bd lt [~ ht] mt cp ~ bd hh").juxFlip(rev)
```

```strudel
s("bd lt [~ ht] mt cp ~ bd hh").juxFlip(press)
```

```strudel
s("bd lt [~ ht] mt cp ~ bd hh").juxFlip(iter(4))
```

## juxFlipBy
Synonyms: juxflipby, fluxBy, fluxby

Like juxBy, except it flips the ears each cycle.

```strudel
s("bd lt [~ ht] mt cp ~ bd hh").juxFlipBy(".8", rev)
```

## K
Tags: generators, superdough

Produces a Kabelsalat modular sound engine.
This can be used as either an effect (by including audioin() at the beginning
of your kabel expression) or as a sound source (via any expression which doesn't
start with audioin()).

Some helpers you have available to you:

Strudel mini notation works fine in K(..) via "" or ``
More complex Strudel expressions (like "0 1 2".fast(4) or irand(24)) can be
written by wrapping them in S(..) inside your Kabel code
We expose Strudel's note frequency under sFreq and Strudel's gate
information under sGate
You can use more complex multi-line expressions (like let x = a; let y = b; x.lpf(y);)
by wrapping them inside a function in K (see example).

Parameters:
- `expr` (KabelsalatExpression | function) — Kabelsalat graph definition

```strudel
note("A c e".fast(4)).transpose("<0 2 4 6 8>")
  .scale("F:minor").transpose("12")
  .s("saw")
  .K(
    // audioin().mul(sGate.adsr(0.001, 0.3, 0, 0.2)) // as effect
    saw(saw(sFreq / "2!3 16").mul(8).add(sFreq).lag("0!3 0.1")).mul(0.3) // as source
    .mul(sGate.adsr(0, 0.15, 0.5, "0.1!3 1"))
    .lpf(sGate.adsr(0, 0.2, 0.3, 0.2).mul(1).add(0))
    .add(x => x.delay(S("0.3 0.2".fast(2))).mul(0.7))
    .add(x => x.delay("0.03 [0.08 0.01] 0.01 0.013").mul(0.77)).mul(0.7)
    .add(x => x.delay(.13).mul(0.7))
    .out()
  )
```

```strudel
n("<0 1 <2 3 2 4>>*16")
  .scale("G#2:minor").sometimes(x => x.transpose("12 | 24"))
  .K(() => {
    const att = S(rand.range(0, 0.05))
    const dec = S(rand.range(0.05, 0.2))
    let f = n(sFreq);
    const mod = sine(f).mul("0.1 | 0.2 | 0.3")
      .add("[[1.5 1] | 1 | 2 | 4 | [6 4@3]]*2")
    saw(f.mul(mod))
    .mul(sGate.ad(att, dec))
    .add(x => x.delay(0.4).mul(0.3))
    .out()
  }).fxr(1).room(0.3)
```

## keep
Tags: internal, combiners

When called on a pattern a, with a input pattern b (a.keep(b)),
combines a and b such that anything defined in a,
and anything defined in b that is not defined in a
will be in the resulting pattern

The structure is maintained from a,
because the default pattern alignment is in,
see the section on Pattern Alignment
in the technical manual in the docs

This is the inverse of set

See examples below

Parameters:
- `pat` (Pattern)

```strudel
// notes, already defined, will stay "c a f e",
// while "s", not defined, will be set to "piano"
note("c a f e").keep(note("e f a c").s("piano"))
```

## keyDown
Tags: external_io

returns true when a key or array of keys is held
Key name reference

```strudel
keyDown("Control:j").pick([s("bd(5,8)"), s("cp(3,8)")])
```

## label
Tags: visualization

Sets the displayed text for an event on the pianoroll

Parameters:
- `label` (string) — text to display

## lastOf
Tags: temporal

Applies the given function every n cycles, starting from the last cycle.

Parameters:
- `n` (number) — how many cycles
- `func` (function) — function to apply

```strudel
note("c3 d3 e3 g3").lastOf(4, x=>x.rev())
```

## late
Tags: temporal

Nudge a pattern to start later in time. Equivalent of Tidal's ~> operator

Parameters:
- `cycles` (number | Pattern) — number of cycles to nudge right

```strudel
"bd ~".stack("hh ~".late(.1)).s()
```

## layer
Tags: combiners

Layers the result of the given function(s). Like superimpose, but without the original pattern:

```strudel
"<0 2 4 6 ~ 4 ~ 2 0!3 ~!5>*8"
  .layer(x=>x.add("0,2"))
  .scale('C minor').note()
```

## lfo
Tags: lfo, superdough

Configures an LFO. Can be called in sequence like pat.lfo(...).lfo(...) to set up multiple LFOs.
There are two ways to declare which control will be modulated:

Explicitly put control in the config (e.g. lfo({ c: "lpf" }))
If the control parameter is absent, the control immediately before the lfo call will be used
(e.g. s("saw").lpf(500).lfo() to modulate lpf)

Modulators can be referred to by id so that they can be updated later e.g. inside
a sometimes. See example below.

Parameters:
- `config` (Object) — LFO configuration.
- `config.control` (string | Pattern) — Node to modulate. Aliases: c
- `config.subControl` (string | Pattern) — Sub-control name to append to the control key. Aliases: sc
- `config.rate` (number | Pattern) — Modulation rate. Aliases: r
- `config.sync` (number | Pattern) — Tempo-synced modulation rate. Aliases: s
- `config.depth` (number | Pattern) — Relative modulation depth. Aliases: dep, dr
- `config.depthabs` (number | Pattern) — Absolute modulation depth. Aliases: da
- `config.dcoffset` (number | Pattern) — DC offset / bias for the waveform. Aliases: dc
- `config.shape` (number | Pattern) — Shape index. Aliases: sh
- `config.skew` (number | Pattern) — Skew amount. Aliases: sk
- `config.curve` (number | Pattern) — Exponential curve amount. Aliases: cu
- `config.retrig` (number | Pattern) — If > 0.5, the LFO will retrigger on each event. Aliases: rt
- `config.fxi` (number | Pattern) — FX index to target
- `id` (string | Pattern) — ID to use for this modulator

```strudel
s("saw").note("F1").lpf(500).lfo()
```

```strudel
s("saw").lfo().lpf(500).lfo({ s: 0.3 })
```

```strudel
s("saw").lpf(500).diode(0.3)
  .lfo({ c: "lpf" })
```

```strudel
s("pulse").lpf(500).lfo()
  .lfo({ c: "s" })
  .diode(0.3)
  .sometimes(x => x.lfo({ s: "8" }, 1)) // lfo #1 (0-indexed)
```

```strudel
s("pulse").lpf(500).lfo({ depth: 4 }, 'lpf_mod')
  .lfo({ c: "s" })
  .diode(0.3)
  .sometimes(x => x.lfo({ s: "8" }, 'lpf_mod'))
```

## linger
Tags: temporal

Selects the given fraction of the pattern and repeats that part to fill the remainder of the cycle.

Parameters:
- `fraction` (number) — fraction to select

```strudel
s("lt ht mt cp, [hh oh]*2").linger("<1 .5 .25 .125>")
```

## log
Tags: visualization

Writes the content of the current event to the console (visible in the side menu).

```strudel
s("bd sd").log()
```

## logValues
Tags: visualization

A simplified version of log which writes all "values" (various configurable parameters)
within the event to the console (visible in the side menu).

```strudel
s("bd sd").gain("0.25 0.5 1").n("2 1 0").logValues()
```

## loop
Tags: samples

Loops the sample.
Note that the tempo of the loop is not synced with the cycle tempo.
To change the loop region, use loopBegin / loopEnd.

Parameters:
- `on` (number | Pattern) — If 1, the sample is looped

```strudel
s("casio").loop(1)
```

## loopAt
Tags: samples, pitch

Makes the sample fit the given number of cycles by changing the speed.

```strudel
samples({ rhodes: 'https://cdn.freesound.org/previews/132/132051_316502-lq.mp3' })
s("rhodes").loopAt(2)
```

## loopAtCps
Tags: samples, pitch

Makes the sample fit the given number of cycles and cps value, by
changing the speed. deprecated: use loopAt or fit instead, together with setCps / setCpm.

```strudel
samples({ rhodes: 'https://cdn.freesound.org/previews/132/132051_316502-lq.mp3' })
s("rhodes").loopAtCps(4,1.5).cps(1.5)
```

## loopBegin
Synonyms: loopb
Tags: samples

Begin to loop at a specific point in the sample (inbetween begin and end).
Note that the loop point must be inbetween begin and end, and before loopEnd!
Note: Samples starting with wt_ will automatically loop! (wt = wavetable)

Parameters:
- `time` (number | Pattern) — between 0 and 1, where 1 is the length of the sample

```strudel
s("space").loop(1)
.loopBegin("<0 .125 .25>")._scope()
```

## loopEnd
Synonyms: loope
Tags: samples

End the looping section at a specific point in the sample (inbetween begin and end).
Note that the loop point must be inbetween begin and end, and after loopBegin!

Parameters:
- `time` (number | Pattern) — between 0 and 1, where 1 is the length of the sample

```strudel
s("space").loop(1)
.loopEnd("<1 .75 .5 .25>")._scope()
```

## lpattack
Synonyms: lpa
Tags: filter, envelope, superdough

Sets the attack duration for the lowpass filter envelope.

Parameters:
- `attack` (number | Pattern) — time of the filter envelope

```strudel
note("c2 e2 f2 g2")
.sound('sawtooth')
.lpf(300)
.lpa("<.5 .25 .1 .01>/4")
.lpenv(4)
```

## lpdc
Tags: filter, lfo, superdough

DC offset of the LFO for the lowpass filter

Parameters:
- `dcoffset` (number | Pattern) — dc offset. set to 0 for unipolar

## lpdecay
Synonyms: lpd
Tags: filter, envelope, superdough

Sets the decay duration for the lowpass filter envelope.

Parameters:
- `decay` (number | Pattern) — time of the filter envelope

```strudel
note("c2 e2 f2 g2")
.sound('sawtooth')
.lpf(300)
.lpd("<.5 .25 .1 0>/4")
.lpenv(4)
```

## lpdepth
Tags: filter, lfo, superdough

Depth of the LFO for the lowpass filter

Parameters:
- `depth` (number | Pattern) — depth of modulation

```strudel
note("<c c c# c c c4>*16").s("sawtooth").lpf(600).lpdepth("<1 .5 1.8 0>")
```

## lpdepthfrequency
Synonyms: lpdepthfreq
Tags: filter, lfo, superdough

Depth of the LFO for the lowpass filter, in HZ

Parameters:
- `depth` (number | Pattern) — depth of modulation

```strudel
note("<c c c# c c c4>*16").s("sawtooth").lpf(600).lpdepthfrequency("<200 500 100 0>")
```

## lpenv
Synonyms: lpe
Tags: filter, envelope, superdough

Sets the lowpass filter envelope modulation depth.

Parameters:
- `modulation` (number | Pattern) — depth of the lowpass filter envelope between 0 and n

```strudel
note("c2 e2 f2 g2")
.sound('sawtooth')
.lpf(300)
.lpa(.5)
.lpenv("<4 2 1 0 -1 -2 -4>/4")
```

## lpf
Synonyms: cutoff, ctf, lp
Tags: filter, superdough

Applies the cutoff frequency of the low-pass filter.

When using mininotation, you can also optionally add the 'lpq' parameter, separated by ':'.

Parameters:
- `frequency` (number | Pattern) — audible between 0 and 20000

```strudel
s("bd sd [~ bd] sd,hh*6").lpf("<4000 2000 1000 500 200 100>")
```

```strudel
s("bd*16").lpf("1000:0 1000:10 1000:20 1000:30")
```

## lpq
Synonyms: resonance
Tags: filter, superdough

Controls the low-pass q-value.

Parameters:
- `q` (number | Pattern) — resonance factor between 0 and 50

```strudel
s("bd sd [~ bd] sd,hh*8").lpf(2000).lpq("<0 10 20 30>")
```

## lprate
Tags: filter, lfo, superdough

Rate of the LFO for the lowpass filter

Parameters:
- `rate` (number | Pattern) — rate in hertz

```strudel
note("<c c c# c c c4>*16").s("sawtooth").lpf(600).lprate("<4 8 2 1>")
```

## lprelease
Synonyms: lpr
Tags: filter, envelope, superdough

Sets the release time for the lowpass filter envelope.

Parameters:
- `release` (number | Pattern) — time of the filter envelope

```strudel
note("c2 e2 f2 g2")
.sound('sawtooth')
.clip(.5)
.lpf(300)
.lpenv(4)
.lpr("<.5 .25 .1 0>/4")
.release(.5)
```

## lpshape
Tags: filter, lfo, superdough

Shape of the LFO for the lowpass filter

Parameters:
- `shape` (number | Pattern) — Shape of the lfo (0, 1, 2, ..)

## lpskew
Tags: filter, lfo, superdough

Skew of the LFO for the lowpass filter

Parameters:
- `skew` (number | Pattern) — How much to bend the LFO shape

## lpsustain
Synonyms: lps
Tags: filter, envelope, superdough

Sets the sustain amplitude for the lowpass filter envelope.

Parameters:
- `sustain` (number | Pattern) — amplitude of the lowpass filter envelope

```strudel
note("c2 e2 f2 g2")
.sound('sawtooth')
.lpf(300)
.lpd(.5)
.lps("<0 .25 .5 1>/4")
.lpenv(4)
```

## lpsync
Tags: filter, lfo, superdough

Cycle-synced rate of the LFO for the lowpass filter

Parameters:
- `rate` (number | Pattern) — rate in cycles

```strudel
note("<c c c# c c c4>*16").s("sawtooth").lpf(600).lpsync("<4 8 2 1>")
```

## markcss
Tags: visualization

Overrides the css of highlighted events. Make sure to use single quotes!

```strudel
note("c a f e")
.markcss('text-decoration:underline')
```

## mask
Tags: temporal

Returns silence when mask is 0 or "~"

```strudel
note("c [eb,g] d [eb,g]").mask("<1 [0 1]>")
```

## midi
Tags: external_io

MIDI output: Opens a MIDI output port.

Parameters:
- `midiport` (string | number) — MIDI device name or index defaulting to 0
- `options` (object) — Additional MIDI configuration options

```strudel
note("c4").midichan(1).midi('IAC Driver Bus 1')
```

```strudel
note("c4").midichan(1).midi('IAC Driver Bus 1', { controller: true, latency: 50 })
```

## midibend
Tags: external_io, midi

MIDI pitch bend: Sends a MIDI pitch bend message.

Parameters:
- `midibend` (number | Pattern) — MIDI pitch bend (-1 - 1)

```strudel
note("c4").midibend(sine.slow(4).range(-0.4,0.4)).midi()
```

## midichan
Tags: external_io, midi

MIDI channel: Sets the MIDI channel for the event.

Parameters:
- `channel` (number | Pattern) — MIDI channel number (0-15)

```strudel
note("c4").midichan(1).midi()
```

## midicmd
Tags: external_io, midi

MIDI command: Sends a MIDI command message.

Parameters:
- `command` (number | Pattern) — MIDI command

```strudel
midicmd("clock*48,<start stop>/2").midi()
```

## midikeys
Tags: external_io, midi

MIDI keyboard: Opens a MIDI input port to receive MIDI keyboard messages.

The note length is fixed as Superdough is not currently set up for undetermined
note durations

The 'midichan' control value contains the number of the channel the note is coming from
so it could be filtered or manipulated further in the chain.

Parameters:
- `input` (string | number) — MIDI device name or index defaulting to 0

```strudel
const kb = await midikeys('Arturia KeyStep 32')
kb().s("tri").lpf(80).lpe(6).lpd(0.1).room(2).delay(0.35)
```

```strudel
const kb = await midikeys('Arturia KeyStep 32')
kb("0.5 1")
  .s("saw")
  .add(note(rand.mul(0.3)))
  .lpf(1000).lpe(2).room(0.5)
```

```strudel
// discard all notes not coming out from midi channel 2
const kb = await midikeys('Arturia KeyStep 32')
kb().filterValues(v=>v.midichan==2).s("tri")
```

## midimaps
Tags: external_io, midi

Adds midimaps to the registry. Inside each midimap, control names (e.g. lpf) are mapped to cc numbers.

```strudel
midimaps({ mymap: { lpf: 74 } })
$: note("c a f e")
.lpf(sine.slow(4))
.midimap('mymap')
.midi()
```

```strudel
midimaps({ mymap: {
  lpf: { ccn: 74, min: 0, max: 20000, exp: 0.5 }
}})
$: note("c a f e")
.lpf(sine.slow(2).range(400,2000))
.midimap('mymap')
.midi()
```

## midin
Tags: external_io, midi

MIDI input: Opens a MIDI input port to receive MIDI control change messages.

The output is a function that accepts a midi cc value to query as well as (optionally) a midi channel

Parameters:
- `input` (string | number) — MIDI device name or index defaulting to 0

```strudel
const cc = await midin('IAC Driver Bus 1')
note("c a f e").lpf(cc(0).range(0, 1000)).lpq(cc(1).range(0, 10)).sound("sawtooth")
```

```strudel
const allCC = await midin('IAC Driver Bus 1')
const cc = (ccNum) => allCC(ccNum, 2) // just channel 2
note("c a f e").s("saw")
  .when(cc(0).gt(0), x => x.postgain(0))
```

## midiport
Tags: external_io, midi

MIDI port: Sets the MIDI port for the event.

Parameters:
- `port` (number | Pattern) — MIDI port

```strudel
note("c a f e").midiport("<0 1 2 3>").midi()
```

## miditouch
Tags: external_io, midi

MIDI key after touch: Sends a MIDI key after touch message.

Parameters:
- `miditouch` (number | Pattern) — MIDI key after touch (0-1)

```strudel
note("c4").miditouch(sine.slow(4).range(0,1)).midi()
```

## mode
Tags: tonal

Remove anchor note from the voicing. Useful for melody harmonization

Parameters:
- `modeName` (string | Pattern) — one of {below | above | duck | root}

```strudel
mode("<below above duck root>").chord("C").voicing()
```

## morph
Tags: temporal

Takes two binary rhythms represented as lists of 1s and 0s, and a number
between 0 and 1 that morphs between them. The two lists should contain the same
number of true values.

```strudel
sound("hh").struct(morph([1,0,1,0,1,0,1,0], // straight rhythm
                         [1,1,0,1,0,1,0], // wonky rhythm
                         0.25 // creates a slightly wonky rhythm
                        )
                  )
```

```strudel
sound("hh").struct(morph("1:0:1:0:1:0:1:0", // straight rhythm
                         "1:1:0:1:0:1:0", // wonky rhythm
                         sine.slow(8) // slowly morph between the rhythms
                        )
                  )
```

## mousex
Tags: external_io

The mouse's x position value ranges from 0 to 1.

```strudel
n(mousex.segment(4).range(0,7)).scale("C:minor")
```

## mousey
Tags: external_io

The mouse's y position value ranges from 0 to 1.

```strudel
n(mousey.segment(4).range(0,7)).scale("C:minor")
```

## mul
Tags: math

Multiplies each number by the given factor.

```strudel
"<1 1.5 [1.66, <2 2.33>]>*4".mul(150).freq()
```

## n
Tags: superdough, samples, tonal

Selects the given index:

for samples, it picks the sample by index, with wrap around
for scales, it picks the scale degree
for voicings, it picks the voice index

Parameters:
- `value` (number | Pattern) — sample index starting from 0

```strudel
s("bd sd [~ bd] sd,hh*6").n("<0 1>")
```

## never
Tags: temporal

Shorthand for .sometimesBy(0, fn) (never calls fn)

```strudel
s("hh*8").never(x=>x.speed("0.5"))
```

## noise
Tags: generators, superdough

Adds pink noise to the mix

Parameters:
- `wet` (number | Pattern) — wet amount

```strudel
sound("<white pink brown>/2")
```

## note
Tags: tonal

Plays the given note name or midi number. A note name consists of

a letter (a-g or A-G)
optional accidentals (b or #)
optional (possibly negative) octave number (0-9). Defaults to 3

Examples of valid note names: c, bb, Bb, f#, c3, A4, Eb2, c#5

You can also use midi numbers instead of note names, where 69 is mapped to A4 440Hz in 12EDO.

```strudel
note("c a f e")
```

```strudel
note("c4 a4 f4 e4")
```

```strudel
note("60 69 65 64")
```

```strudel
note("fbb1 a#0 cbbb-1 e##-2").sound("saw")
```

## nrpnn
Tags: external_io, midi

MIDI NRPN non-registered parameter number: Sends a MIDI NRPN non-registered parameter number message.

Parameters:
- `nrpnn` (number | Pattern) — MIDI NRPN non-registered parameter number (0-127)

```strudel
note("c4").nrpnn("1:8").nrpv("123").midichan(1).midi()
```

## nrpv
Tags: external_io, midi

MIDI NRPN non-registered parameter value: Sends a MIDI NRPN non-registered parameter value message.

Parameters:
- `nrpv` (number | Pattern) — MIDI NRPN non-registered parameter value (0-127)

```strudel
note("c4").nrpnn("1:8").nrpv("123").midichan(1).midi()
```

## octaves
Tags: tonal

How many octaves are voicing steps spread apart, defaults to 1

Parameters:
- `count` (number | Pattern) — the number of octaves

```strudel
chord("<Am C D F Am E Am E>").octaves("<2 4>").voicing()
```

## off
Tags: temporal

Superimposes the function result on top of the original pattern, delayed by the given time.

Parameters:
- `time` (Pattern | number) — offset time
- `func` (function) — function to apply

```strudel
"c3 eb3 g3".off(1/8, x=>x.add(7)).note()
```

## offset
Tags: tonal

Sets how the voicing is offset from the anchored position

Parameters:
- `shift` (number | Pattern) — the amount to shift the voicing up or down

```strudel
chord("<Am C D F Am E Am E>").offset("<0 1 2 3 4 5>") // alter the voicing each time
```

## often
Tags: temporal

Shorthand for .sometimesBy(0.75, fn)

```strudel
s("hh*8").often(x=>x.speed("0.5"))
```

## onsetsOnly
Tags: internals

Returns a new pattern, with all haps without onsets filtered out. A hap
with an onset is one with a whole timespan that begins at the same time
as its part timespan.

## onTriggerTime
Tags: external_io

make something happen on event time
uses browser timeout which is innacurate for audio tasks

```strudel
s("bd!8").onTriggerTime((hap) => {console.log(hap)})
```

## orbit
Synonyms: o
Tags: superdough

An orbit is a global parameter context for patterns. Patterns with the same orbit will share the same global effects.

Parameters:
- `number` (number | Pattern)

```strudel
stack(
  s("hh*6").delay(.5).delaytime(.25).orbit(1),
  s("~ sd ~ sd").delay(.5).delaytime(.125).orbit(2)
)
```

## orientationAlpha
Synonyms: oriA, oriZ, orientationZ
Tags: external_io

The device's orientation alpha value ranges from 0 to 1.

```strudel
n(orientationAlpha.segment(4).range(0,7)).scale("C:minor")
```

## orientationBeta
Synonyms: oriB, oriX, orientationX
Tags: external_io

The device's orientation beta value ranges from 0 to 1.

```strudel
n(orientationBeta.segment(4).range(0,7)).scale("C:minor")
```

## orientationGamma
Synonyms: oriG, oriY, orientationY
Tags: external_io

The device's orientation gamma value ranges from 0 to 1.

```strudel
n(orientationGamma.segment(4).range(0,7)).scale("C:minor")
```

## osc
Tags: external_io

Sends each hap as an OSC message, which can be picked up by SuperCollider or any other OSC-enabled software.
For more info, read MIDI & OSC in the docs

## oschost
Tags: external_io

The host to send open sound control messages to. Requires running the OSC bridge.

Parameters:
- `oschost` (string | Pattern) — e.g. 'localhost'

```strudel
note("c4").oschost('127.0.0.1').oscport(57120).osc();
```

## oscport
Tags: external_io

The port to send open sound control messages to. Requires running the OSC bridge.

Parameters:
- `oscport` (number | Pattern) — e.g. 57120

```strudel
note("c4").oschost('127.0.0.1').oscport(57120).osc();
```

## outside
Tags: temporal

Carries out an operation 'outside' a cycle.

```strudel
"<[0 1] 2 [3 4] 5>".outside(4, rev).scale('C major').note()
// "<[0 1] 2 [3 4] 5>".fast(4).rev().slow(4).scale('C major').note()
```

## pace
Tags: stepwise

Experimental

Speeds a pattern up or down, to fit to the given number of steps per cycle.

```strudel
sound("bd sd cp").pace(4)
// The same as sound("{bd sd cp}%4") or sound("<bd sd cp>*4")
```

## palindrome
Tags: temporal

Applies rev to a pattern every other cycle, so that the pattern alternates between forwards and backwards.

```strudel
note("c d e g").palindrome()
```

## pan
Tags: superdough

Sets position in stereo.

Parameters:
- `pan` (number | Pattern) — between 0 and 1, from left to right (assuming stereo), once round a circle (assuming multichannel)

```strudel
s("[bd hh]*2").pan("<.5 1 .5 0>")
```

```strudel
s("bd rim sd rim bd ~ cp rim").pan(sine.slow(2))
```

## panchor
Tags: pitch, envelope, superdough

Sets the range anchor of the envelope:

anchor 0: range = [note, note + penv]
anchor 1: range = [note - penv, note]
If you don't set an anchor, the value will default to the psustain value.

Parameters:
- `anchor` (number | Pattern) — anchor offset

```strudel
note("c c4").penv(12).panchor("<0 .5 1 .5>")
```

## parray
Tags: combiners

Turns a list of patterns into a single pattern which outputs list-values

## partials
Tags: superdough

Scale the magnitude of the harmonics of one of the core synths ('sine', 'tri', 'saw', ..)

Can also be used to create a new synth via s('user').partials(...)

Parameters:
- `magnitudes` (Array.<number> | Pattern) — List of [0, 1] magnitudes for partials. 0th entry is the fundamental harmonic (i.e. DC offset is skipped)

```strudel
s("user").seg(16).n(irand(8)).scale("A:major")
  .partials([1, 0, 1, 0, 0, 1])
```

```strudel
s("saw").seg(8).n(irand(12)).scale("G#:minor")
  .partials(binaryL(irand(256).add("1")))
```

## pattack
Synonyms: patt
Tags: pitch, envelope, superdough

Attack time of pitch envelope.

Parameters:
- `time` (number | Pattern) — time in seconds

```strudel
note("c eb g bb").pattack("0 .1 .25 .5").slow(2)
```

## Pattern

Create a pattern. As an end user, you will most likely not create a Pattern directly.

Parameters:
- `query` (function) — The function that maps a State to an array of Hap.

## pcurve
Tags: pitch, envelope, superdough

Curve of envelope. Defaults to linear. exponential is good for kicks

Parameters:
- `type` (number | Pattern) — 0 = linear, 1 = exponential

```strudel
note("g1*4")
.s("sine").pdec(.5)
.penv(32)
.pcurve("<0 1>")
```

## pdecay
Synonyms: pdec
Tags: pitch, envelope, superdough

Decay time of pitch envelope.

Parameters:
- `time` (number | Pattern) — time in seconds

```strudel
note("<c eb g bb>").pdecay("<0 .1 .25 .5>")
```

## penv
Tags: pitch, envelope, superdough

Amount of pitch envelope. Negative values will flip the envelope.
If you don't set other pitch envelope controls, pattack:.2 will be the default.

Parameters:
- `semitones` (number | Pattern) — change in semitones

```strudel
note("c")
.penv("<12 7 1 .5 0 -1 -7 -12>")
```

## per
Synonyms: perCycle
Tags: temporal

A pattern measuring the 'shortness' of events, or in other words, the duration of pattern events,
in events per cycle. per doesn't have structure itself, but takes structure, and therefore
event durations, from the pattern that it is combined with.
For example per.struct("1 1 [1 1] 1") would give the same as "4 4 [8 8] 4".
See also its reciprocal, cyclesPer.

```strudel
// Shorter events are more distorted
n("0 0*2 0 0*2 0 [0 0 0]@2").sound("bd")
 .distort(per.div(2))
```

## perlin
Tags: generators

Generates a continuous pattern of perlin noise, in the range 0..1.

```strudel
// randomly change the cutoff
s("bd*4,hh*8").cutoff(perlin.range(500,8000))
```

## perx
Tags: temporal

Like per but measures the shortness of events according to an exponential curve. In
particular, where the event duration halves, the
returned value increases by one. perx.struct("1 1 [1 [1 1]] 1") would therefore be
the same as "3 3 [4 [5 5]] 3".

## phaser
Synonyms: ph
Tags: superdough

Phaser audio effect that approximates popular guitar pedals.

Parameters:
- `speed` (number | Pattern) — speed of modulation

```strudel
n(run(8)).scale("D:pentatonic").s("sawtooth").release(0.5)
.phaser("<1 2 4 8>")
```

## phasercenter
Synonyms: phc
Tags: superdough

The center frequency of the phaser in HZ. Defaults to 1000

Parameters:
- `centerfrequency` (number | Pattern) — in HZ

```strudel
n(run(8)).scale("D:pentatonic").s("sawtooth").release(0.5)
.phaser(2).phasercenter("<800 2000 4000>")
```

## phaserdepth
Synonyms: phd, phasdp
Tags: superdough

The amount the signal is affected by the phaser effect. Defaults to 0.75

Parameters:
- `depth` (number | Pattern) — number between 0 and 1

```strudel
n(run(8)).scale("D:pentatonic").s("sawtooth").release(0.5)
.phaser(2).phaserdepth("<0 .5 .75 1>")
```

## phasersweep
Synonyms: phs
Tags: superdough, lfo

The frequency sweep range of the lfo for the phaser effect. Defaults to 2000

Parameters:
- `phasersweep` (number | Pattern) — most useful values are between 0 and 4000

```strudel
n(run(8)).scale("D:pentatonic").s("sawtooth").release(0.5)
.phaser(2).phasersweep("<800 2000 4000>")
```

## phases
Tags: superdough

Rotates the harmonics of one of the core synths ('sine', 'tri', 'saw', 'user', ..) by a list of phases

Parameters:
- `phases` (Array.<number> | Pattern) — List of [0, 1) phases for partials. 0th entry is the fundamental phase (i.e. DC offset is skipped)

```strudel
// Phase cancellation
s("saw").seg(8).n(irand(12)).scale("G#1:minor")
  .partials(partials([1, 1, 1]))
  .superimpose(x => x.phases([0.5, 0.5, 0.5]))
```

## pianoroll
Synonyms: punchcard
Tags: visualization

Visualises a pattern as a scrolling 'pianoroll', displayed in the background of the editor. To show a pianoroll for all running patterns, use all(pianoroll). To have a pianoroll appear below
a pattern instead, prefix with _, e.g.: sound("bd sd")._pianoroll().

Parameters:
- `options` (Object) — Object containing all the optional following parameters as key value pairs:
- `cycles` (integer) — number of cycles to be displayed at the same time - defaults to 4
- `playhead` (number) — location of the active notes on the time axis - 0 to 1, defaults to 0.5
- `vertical` (boolean) — displays the roll vertically - 0 by default
- `labels` (boolean) — displays labels on individual notes (see the label function) - 0 by default
- `flipTime` (boolean) — reverse the direction of the roll - 0 by default
- `flipValues` (boolean) — reverse the relative location of notes on the value axis - 0 by default
- `overscan` (number) — lookup X cycles outside of the cycles window to display notes in advance - 1 by default
- `hideNegative` (boolean) — hide notes with negative time (before starting playing the pattern) - 0 by default
- `smear` (boolean) — notes leave a solid trace - 0 by default
- `fold` (boolean) — notes takes the full value axis width - 0 by default
- `active` (string) — hexadecimal or CSS color of the active notes - defaults to #FFCA28
- `inactive` (string) — hexadecimal or CSS color of the inactive notes - defaults to #7491D2
- `background` (string) — hexadecimal or CSS color of the background - defaults to transparent
- `playheadColor` (string) — hexadecimal or CSS color of the line representing the play head - defaults to white
- `fill` (boolean) — notes are filled with color (otherwise only the label is displayed) - 0 by default
- `fillActive` (boolean) — active notes are filled with color - 0 by default
- `stroke` (boolean) — notes are shown with colored borders - 0 by default
- `strokeActive` (boolean) — active notes are shown with colored borders - 0 by default
- `hideInactive` (boolean) — only active notes are shown - 0 by default
- `colorizeInactive` (boolean) — use note color for inactive notes - 1 by default
- `fontFamily` (string) — define the font used by notes labels - defaults to 'monospace'
- `minMidi` (integer) — minimum note value to display on the value axis - defaults to 10
- `maxMidi` (integer) — maximum note value to display on the value axis - defaults to 90
- `autorange` (boolean) — automatically calculate the minMidi and maxMidi parameters - 0 by default

```strudel
note("c2 a2 eb2")
.euclid(5,8)
.s('sawtooth')
.lpenv(4).lpf(300)
.pianoroll({ labels: 1 })
```

## pick
Tags: combiners

Picks patterns (or plain values) either from a list (by index) or a lookup table (by name).
Similar to inhabit, but maintains the structure of the original patterns.

Parameters:
- `pat` (Pattern)
- `xs` (*)

```strudel
note("<0 1 2!2 3>".pick(["g a", "e f", "f g f g" , "g c d"]))
```

```strudel
sound("<0 1 [2,0]>".pick(["bd sd", "cp cp", "hh hh"]))
```

```strudel
sound("<0!2 [0,1] 1>".pick(["bd(3,8)", "sd sd"]))
```

```strudel
s("<a!2 [a,b] b>".pick({a: "bd(3,8)", b: "sd sd"}))
```

## pickAndRename
Tags: internals

Selects entries from source and renames them via map

## pickF
Tags: combiners, functional

pickF lets you use a pattern of numbers to pick which function to apply to another pattern.

Parameters:
- `pat` (Pattern)
- `lookup` (Pattern) — a pattern of indices or names
- `lookup` (Array.<function()> | object) — the array or lookup object of functions from which to pull

```strudel
s("bd [rim hh]").pickF("<0 1 2>", [rev,jux(rev),fast(2)])
```

```strudel
note("<c2 d2>(3,8)").s("square")
.pickF("<0 2> 1", [jux(rev), fast(2), x=>x.lpf(800)])
```

```strudel
note("<c2 d2>(3,8)").s("square")
.pickF("<jr l> f", { jr:jux(rev), f:fast(2), l:x=>x.lpf(800) })
```

## pickmod
Tags: combiners

The same as pick, but if you pick a number greater than the size of the list,
it wraps around, rather than sticking at the maximum value.
For example, if you pick the fifth pattern of a list of three, you'll get the
second one.

Parameters:
- `pat` (Pattern)
- `xs` (*)

## pickmodF
Tags: combiners

The same as pickF, but if you pick a number greater than the size of the functions list,
it wraps around, rather than sticking at the maximum value.

Parameters:
- `pat` (Pattern)
- `lookup` (Pattern) — a pattern of indices or names
- `lookup` (Array.<function()> | object) — the array or lookup object of functions from which to pull

## pickmodOut
Tags: combiners

The same as pickOut, but if you pick a number greater than the size of the list,
it wraps around, rather than sticking at the maximum value.

Parameters:
- `pat` (Pattern)
- `xs` (*)

## pickmodReset
Tags: combiners

The same as pickReset, but if you pick a number greater than the size of the list,
it wraps around, rather than sticking at the maximum value.

Parameters:
- `pat` (Pattern)
- `xs` (*)

## pickmodRestart
Tags: combiners

The same as pickRestart, but if you pick a number greater than the size of the list,
it wraps around, rather than sticking at the maximum value.

Parameters:
- `pat` (Pattern)
- `xs` (*)

```strudel
"<a@2 b@2 c@2 d@2>".pickRestart({
        a: n("0 1 2 0"),
        b: n("2 3 4 ~"),
        c: n("[4 5] [4 3] 2 0"),
        d: n("0 -3 0 ~")
      }).scale("C:major").s("piano")
```

## pickOut
Tags: combiners

Similar to pick, but it applies an outerJoin instead of an innerJoin.

Parameters:
- `pat` (Pattern)
- `xs` (*)

## pickReset
Tags: combiners

Similar to pick, but the choosen pattern is reset when its index is triggered.

Parameters:
- `pat` (Pattern)
- `xs` (*)

## pickRestart
Tags: combiners

Similar to pick, but the choosen pattern is restarted when its index is triggered.

Parameters:
- `pat` (Pattern)
- `xs` (*)

## pitchwheel
Tags: visualization

Renders a pitch circle to visualize frequencies within one octave

Parameters:
- `hapcircles` (number)
- `circle` (number)
- `edo` (number)
- `root` (string)
- `thickness` (number)
- `hapRadius` (number)
- `mode` (string)
- `margin` (number)

```strudel
n("0 .. 12").scale("C:chromatic")
.s("sawtooth")
.lpf(500)
._pitchwheel()
```

## ply
Tags: temporal

The ply function repeats each event the given number of times.

```strudel
s("bd ~ sd cp").ply("<1 2 3>")
```

## plyForEach
Synonyms: plyforeach
Tags: temporal

The plyForEach function repeats each event the given number of times, applying the given function to each event.
This version of ply uses the iteration index as an argument to the function, similar to echoWith.

Parameters:
- `factor` (number) — how many times to repeat
- `func` (function) — function to apply, given the pattern and the iteration index

```strudel
"<0 [2 4]>"
.plyForEach(4, (p,n) => p.add(n*2))
.scale("C:minor").note()
```

## plyWith
Synonyms: plywith
Tags: temporal

The plyWith function repeats each event the given number of times, applying the given function to each event.\n

Parameters:
- `factor` (number) — how many times to repeat
- `func` (function) — function to apply, given the pattern

```strudel
"<0 [2 4]>"
.plyWith(4, (p) => p.add(2))
.scale("C:minor").note()
```

## polymeter
Synonyms: pm
Tags: stepwise

Experimental

Aligns the steps of the patterns, creating polymeters. The patterns are repeated until they all fit the cycle. For example, in the below the first pattern is repeated twice, and the second is repeated three times, to fit the lowest common multiple of six steps.

```strudel
// The same as note("{c eb g, c2 g2}%6")
polymeter("c eb g", "c2 g2").note()
```

## postgain
Tags: amplitude, superdough

Gain applied after all effects have been processed.

```strudel
s("bd sd [~ bd] sd,hh*8")
.compressor("-20:20:10:.002:.02").postgain(1.5)
```

## prelease
Synonyms: prel
Tags: pitch, envelope, superdough

Release time of pitch envelope

Parameters:
- `time` (number | Pattern) — time in seconds

```strudel
note("<c eb g bb> ~")
.release(.5) // to hear the pitch release
.prelease("<0 .1 .25 .5>")
```

## prepareInputBuffersToSend
Tags: internals

Copy contents of input buffers to buffer actually sent to process

## press
Tags: temporal

Syncopates a rhythm, by shifting each event halfway into its timespan.

```strudel
stack(s("hh*4"),
      s("bd mt sd ht").every(4, press)
     ).slow(2)
```

## pressBy
Tags: temporal

Like press, but allows you to specify the amount by which each
event is shifted. pressBy(0.5) is the same as press, while
pressBy(1/3) shifts each event by a third of its timespan.

```strudel
stack(s("hh*4"),
      s("bd mt sd ht").pressBy("<0 0.5 0.25>")
     ).slow(2)
```

## progNum
Tags: external_io

MIDI program number: Sends a MIDI program change message.

Parameters:
- `program` (number | Pattern) — MIDI program number (0-127)

```strudel
note("c4").progNum(10).midichan(1).midi()
```

## pure
Tags: generators

A discrete value that repeats once per cycle.

```strudel
pure('e4') // "e4"
```

## pw
Tags: superdough

Controls the pulsewidth of the pulse oscillator

Parameters:
- `pulsewidth` (number | Pattern)

```strudel
note("{f a c e}%16").s("pulse").pw(".8:1:.2")
```

```strudel
n(run(8)).scale("D:pentatonic").s("pulse").pw("0 .75 .5 1")
```

## pwrate
Synonyms: pwr
Tags: superdough, lfo

Controls the lfo rate for the pulsewidth of the pulse oscillator

Parameters:
- `rate` (number | Pattern)

```strudel
n(run(8)).scale("D:pentatonic").s("pulse").pw("0.5").pwrate("<5 .1 25>").pwsweep("<0.3 .8>")
```

## pwsweep
Synonyms: pws
Tags: superdough, lfo

Controls the lfo sweep for the pulsewidth of the pulse oscillator

Parameters:
- `sweep` (number | Pattern)

```strudel
n(run(8)).scale("D:pentatonic").s("pulse").pw("0.5").pwrate("<5 .1 25>").pwsweep("<0.3 .8>")
```

## queryArc
Tags: internals

Query haps inside the given time span.

Parameters:
- `begin` (Fraction | number) — from time
- `end` (Fraction | number) — to time

```strudel
const pattern = sequence('a', ['b', 'c'])
const haps = pattern.queryArc(0, 1)
console.log(haps)
silence
```

## rand
Tags: generators

A continuous pattern of random numbers, between 0 and 1.

```strudel
// randomly change the cutoff
s("bd*4,hh*8").cutoff(rand.range(500,8000))
```

## rand2
Tags: generators

A continuous pattern of random numbers, between -1 and 1

## randL
Tags: generators

Creates a list of random numbers of the given length

Parameters:
- `n` (number) — Number of random numbers to sample

```strudel
s("saw").seg(16).n(irand(12)).scale("F1:minor")
  .partials(randL(8))
```

## range
Tags: math

Assumes a numerical pattern, containing unipolar values in the range 0 .. 1.
Returns a new pattern with values scaled to the given min/max range.
Most useful in combination with continuous patterns.

```strudel
s("[bd sd]*2,hh*8")
.cutoff(sine.range(500,4000))
```

## range2
Tags: math

Assumes a numerical pattern, containing bipolar values in the range -1 .. 1
Returns a new pattern with values scaled to the given min/max range.

```strudel
s("[bd sd]*2,hh*8")
.cutoff(sine2.range2(500,4000))
```

## rangex
Tags: math

Assumes a numerical pattern, containing unipolar values in the range 0 .. 1
Returns a new pattern with values scaled to the given min/max range,
following an exponential curve.

```strudel
s("[bd sd]*2,hh*8")
.cutoff(sine.rangex(500,4000))
```

## rarely
Tags: temporal

Shorthand for .sometimesBy(0.25, fn)

```strudel
s("hh*8").rarely(x=>x.speed("0.5"))
```

## ratio
Tags: math

Allows dividing numbers via list notation using ":".
Returns a new pattern with just numbers.

```strudel
ratio("1, 5:4, 3:2").mul(110)
.freq().s("piano")
```

## readInputs
Tags: internals

Read next web audio block to input buffers

## reallocateChannelsIfNeeded
Tags: internals

Handles dynamic reallocation of input/output channels buffer
(channel numbers may vary during lifecycle)

## ref
Tags: internals

exposes a custom value at query time. basically allows mutating state without evaluation

## register
Tags: functional

Registers a new pattern method. The method is added to the Pattern class + the standalone function is returned from register.

Parameters:
- `name` (string | Array.<string>) — name of the function, or an array of names to be used as synonyms
- `func` (function) — function with 1 or more params, where last is the current pattern
- `patternify` (bool) — defaults to true; if set to false, you will have more control over the arguments to func as they will be
in their raw form and it will be up to you to patternify them and/or query them for values

```strudel
const vlpf = register('vlpf', (freq, pat) => {
  return pat.fmap((v) => ({...v, cutoff: freq * (v.velocity ?? 1) }));
})
s("saw").seg(8).velocity(rand).vlpf(800)
```

## release
Synonyms: rel
Tags: amplitude, envelope, superdough

Amplitude envelope release time: The time it takes after the offset to go from sustain level to zero.

Parameters:
- `time` (number | Pattern) — release time in seconds

```strudel
note("c3 e3 g3 c4").release("<0 .1 .4 .6 1>/2")
```

## removeUndefineds
Tags: internals

Returns a new pattern, with haps containing undefined values removed from
query results.

## repeatCycles
Tags: temporal

Repeats each cycle the given number of times.

```strudel
note(irand(12).add(34)).segment(4).repeatCycles(2).s("gm_acoustic_guitar_nylon")
```

## replicate
Tags: stepwise

Experimental

replicate is similar to fast in that it increases its density, but it also increases the step count
accordingly. So stepcat("a b".replicate(2), "c d") would be the same as "a b a b c d", whereas
stepcat("a b".fast(2), "c d") would be the same as "[a b] [a b] c d".

TODO: find out how this function differs from extend

```strudel
stepcat(
  sound("bd bd - cp").replicate(2),
  sound("bd - sd -")
).pace(8)
```

## reset
Tags: temporal

Resets the pattern to the start of the cycle for each onset of the reset pattern.

```strudel
s("[<bd lt> sd]*2, hh*8").reset("<x@3 x(5,8)>")
```

## restart
Tags: temporal

Restarts the pattern for each onset of the restart pattern.
While reset will only reset the current cycle, restart will start from cycle 0.

```strudel
s("[<bd lt> sd]*2, hh*8").restart("<x@3 x(5,8)>")
```

## rev
Tags: temporal

Reverse all cycles in a pattern. See also revv for reversing a whole pattern.

```strudel
note("c d e g").rev()
```

## revv
Tags: temporal

Reverse a whole pattern. See also rev for reversing each cycle.

```strudel
// This is the same as `<[g e] [d c]>`. If `rev()` is used, you get
// the same as `<[d c] [g e]>`, where each cycle reverses, but the order of
// cycles stays the same.
note("<[c d] [e g]>").revv()
```

## ribbon
Synonyms: rib
Tags: temporal

Loops the pattern inside an offset for cycles.
If you think of the entire span of time in cycles as a ribbon, you can cut a single piece and loop it.

Parameters:
- `offset` (number) — start point of loop in cycles
- `cycles` (number) — loop length in cycles

```strudel
note("<c d e f>").ribbon(1, 2)
```

```strudel
// Looping a portion of randomness
n(irand(8).segment(4)).scale("c:pentatonic").ribbon(1337, 2)
```

```strudel
// rhythm generator
s("bd!16?").ribbon(29,.5)
```

## room
Tags: orbit, superdough

Sets the level of reverb.

When using mininotation, you can also optionally add the 'size' parameter, separated by ':'.

Parameters:
- `level` (number | Pattern) — between 0 and 1

```strudel
s("bd sd [~ bd] sd").room("<0 .2 .4 .6 .8 1>")
```

```strudel
s("bd sd [~ bd] sd").room("<0.9:1 0.9:4>")
```

## roomdim
Synonyms: rdim
Tags: orbit, superdough

Reverb lowpass frequency at -60dB (in hertz).
When this property is changed, the reverb will be recaculated, so only change this sparsely..

Parameters:
- `frequency` (number) — between 0 and 20000hz

```strudel
s("bd sd [~ bd] sd").room(0.5).rlp(10000).rdim(8000)
```

```strudel
s("bd sd [~ bd] sd").room(0.5).rlp(5000).rdim(400)
```

## roomfade
Synonyms: rfade
Tags: orbit, superdough

Reverb fade time (in seconds).
When this property is changed, the reverb will be recaculated, so only change this sparsely..

Parameters:
- `seconds` (number) — for the reverb to fade

```strudel
s("bd sd [~ bd] sd").room(0.5).rlp(10000).rfade(0.5)
```

```strudel
s("bd sd [~ bd] sd").room(0.5).rlp(5000).rfade(4)
```

## roomlp
Synonyms: rlp
Tags: orbit, superdough

Reverb lowpass starting frequency (in hertz).
When this property is changed, the reverb will be recaculated, so only change this sparsely..

Parameters:
- `frequency` (number) — between 0 and 20000hz

```strudel
s("bd sd [~ bd] sd").room(0.5).rlp(10000)
```

```strudel
s("bd sd [~ bd] sd").room(0.5).rlp(5000)
```

## roomsize
Synonyms: rsize, sz, size
Tags: orbit, superdough

Sets the room size of the reverb, see room.
When this property is changed, the reverb will be recaculated, so only change this sparsely..

Parameters:
- `size` (number | Pattern) — between 0 and 10

```strudel
s("bd sd [~ bd] sd").room(.8).rsize(1)
```

```strudel
s("bd sd [~ bd] sd").room(.8).rsize(4)
```

## rootNotes
Tags: tonal

Maps the chords of the incoming pattern to root notes in the given octave.

Parameters:
- `octave` (octave) — octave to use

```strudel
"<C^7 A7 Dm7 G7>".rootNotes(2).note()
```

## rotationAlpha
Synonyms: rotA, rotZ, rotationZ
Tags: external_io

The device's rotation around the alpha-axis value ranges from 0 to 1.

```strudel
n(rotationAlpha.segment(4).range(0,7)).scale("C:minor")
```

## rotationBeta
Synonyms: rotB, rotX, rotationX
Tags: external_io

The device's rotation around the beta-axis value ranges from 0 to 1.

```strudel
n(rotationBeta.segment(4).range(0,7)).scale("C:minor")
```

## rotationGamma
Synonyms: rotG, rotY, rotationY
Tags: external_io

The device's rotation around the gamma-axis value ranges from 0 to 1.

```strudel
n(rotationGamma.segment(4).range(0,7)).scale("C:minor")
```

## round
Tags: math

Assumes a numerical pattern. Returns a new pattern with all values rounded
to the nearest integer.

```strudel
n("0.5 1.5 2.5".round()).scale("C:major")
```

## run
Tags: generators

A discrete pattern of numbers from 0 to n-1

```strudel
n(run(4)).scale("C4:pentatonic")
// n("0 1 2 3").scale("C4:pentatonic")
```

## s
Synonyms: sound
Tags: superdough, samples

Select a sound / sample by name. When using mininotation, you can also optionally supply 'n' and 'gain' parameters
separated by ':'.

Parameters:
- `sound` (string | Pattern) — The sound / pattern of sounds to pick

```strudel
s("bd hh")
```

```strudel
s("bd:0 bd:1 bd:0:0.3 bd:1:1.4")
```

## samples
Tags: samples

Loads a collection of samples to use with s

```strudel
samples('github:tidalcycles/dirt-samples');
s("[bd ~]*2, [~ hh]*2, ~ sd")
```

```strudel
samples({
 bd: '808bd/BD0000.WAV',
 sd: '808sd/SD0010.WAV'
 }, 'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/');
s("[bd ~]*2, [~ hh]*2, ~ sd")
```

## saw
Tags: generators

A sawtooth signal between 0 and 1.

```strudel
note("<c3 [eb3,g3] g2 [g3,bb3]>*8")
.clip(saw.slow(2))
```

```strudel
n(saw.range(0,8).segment(8))
.scale('C major')
```

## saw2
Tags: generators

A sawtooth signal between -1 and 1 (like saw, but bipolar).

## scale
Tags: tonal

Turns numbers into notes in the scale (zero indexed) or quantizes notes to a scale.

When describing notes via numbers, note that negative numbers can be used to wrap backwards
in the scale as well as sharps or flats to produce notes outside of the scale.

Also sets scale for other scale operations, like {@link Pattern#scaleTranspose}.

A scale consists of a root note (e.g. c4, c, f#, bb4) followed by semicolon (':') and then a scale type.

The scale name must be written without spaces (because it would be interpreted as a multi-step pattern otherwise).
If your scale name includes spaces, replace them with colons.

The root note defaults to octave 3, if no octave number is given.

Parameters:
- `scale` (string) — Name of scale

```strudel
n("0 2 4 6 4 2").scale("C:major")
```

```strudel
n("[0,7] 4 [2,7] 4")
.scale("C:<major minor>/2")
.s("piano")
```

```strudel
n(rand.range(0,12).segment(8))
.scale("C:ritusen")
.s("piano")
```

```strudel
n("<[0,7b] [-4# -4] [-2,7##] 4 [0,7] [-4# -4b] [-2,7###] 4b>*4")
.scale("C:<major minor>/2")
.s("piano")
```

```strudel
note("C1*16").transpose(irand(36)).scale('Cb2 major').scaleTranspose(3)
```

```strudel
n("[0 0] [1 2] [3 4] [5 6]").scale("C:major:blues")
```

## scaleTranspose
Synonyms: scaleTrans, strans
Tags: tonal

Transposes notes inside the scale by the number of steps.
Expected to be called on a Pattern which already has a {@link Pattern#scale}

Parameters:
- `offset` (offset) — number of steps inside the scale

```strudel
"-8 [2,4,6]"
.scale('C4 bebop major')
.scaleTranspose("<0 -1 -2 -3 -4 -5 -6 -4>")
.note()
```

## scope
Synonyms: tscope
Tags: visualization

Renders an oscilloscope for the time domain of the audio signal.

Parameters:
- `config` (object) — optional config with options:
- `align` (boolean) — if 1, the scope will be aligned to the first zero crossing. defaults to 1
- `color` (string) — line color as hex or color name. defaults to white.
- `thickness` (number) — line thickness. defaults to 3
- `scale` (number) — scales the y-axis. Defaults to 0.25
- `pos` (number) — y-position relative to screen height. 0 = top, 1 = bottom of screen
- `trigger` (number) — amplitude value that is used to align the scope. defaults to 0.

```strudel
s("sawtooth")._scope()
```

## scramble
Tags: temporal

Slices a pattern into the given number of parts, then plays those parts at random. Similar to shuffle,
but parts might be played more than once, or not at all, per cycle.

```strudel
note("c d e f").sound("piano").scramble(4)
```

```strudel
seq("c d e f".scramble(4), "g").note().sound("piano")
```

## scrub
Tags: samples

Allows you to scrub an audio file like a tape loop by passing values that represents the position in the audio file
in the optional array syntax ex: "0.5:2", the second value controls the speed of playback

```strudel
samples('github:switchangel/pad')
s("swpad:0").scrub("{0.1!2 .25@3 0.7!2 <0.8:1.5>}%8")
```

```strudel
samples('github:yaxu/clean-breaks/main');
s("amen/4").fit().scrub("{0@3 0@2 4@3}%8".div(16))
```

## seed
Tags: math

Change the seed for random signals. Normally, random signals depend on time,
so two patterns at the same time will have the same random values. Specifying
a new seed changes the signal output by rand. This also affects other functions
that use randomness, like shuffle and sometimes.

Parameters:
- `n` (number) — A new seed. Can be any number.

```strudel
$: s("hh*4").degrade();
$: s("bd*4").degrade().seed(1); // Will degrade different events from the hi-hat
```

## segment
Synonyms: seg
Tags: temporal

Samples the pattern at a rate of n events per cycle. Useful for turning a continuous pattern into a discrete one.

Parameters:
- `segments` (number) — number of segments per cycle

```strudel
note(saw.range(40,52).segment(24))
```

## seq
Synonyms: fastcat
Tags: combiners

Like cat, but the items are crammed into one cycle.

```strudel
seq("e5", "b4", ["d5", "c5"]).note()
// "e5 b4 [d5 c5]".note()
```

```strudel
// As a chained function:
s("hh*4").seq(
  note("c4(5,8)")
)
```

## seqPLoop
Tags: combiners

Similarly to arrange, allows you to arrange multiple patterns together over multiple cycles.
Unlike arrange, you specify a start and stop time for each pattern rather than duration, which
means that patterns can overlap.

```strudel
seqPLoop(
  [0, 2, "bd(3,8)"],
  [1, 3, "cp(3,8)"]
).sound()
```

## sequence
Tags: combiners

See fastcat

## sequenceP
Tags: temporal

Takes a list of patterns, and returns a pattern of lists.

## set
Tags: internal, combiners

When called on a pattern a, with a input pattern b (a.set(b)),
combines a and b such that anything defined in b
and anything defined in a that is not defined in b
will be in the resulting pattern.

The structure is maintained from a,
because the default pattern alignment is in,
see the section on Pattern Alignment
in the technical manual in the docs

This is the inverse of keep

See examples below

Parameters:
- `pat` (Pattern)

```strudel
// because input pattern has `s` set,
// it overrides the "sine" declared earlier
note("c a f e").s("sine").set(s("triangle"))
```

## setContext
Tags: internals

Returns a new pattern with the context field set to every hap set to the given value.

Parameters:
- `context` (*)

## setcpm
Tags: temporal

Changes the global tempo to the given cycles per minute

Parameters:
- `cpm` (number) — cycles per minute

```strudel
setcpm(140/4) // =140 bpm in 4/4
$: s("bd*4,[- sd]*2").bank('tr707')
```

## setDefaultJoin
Tags: combiners

Sets the default method of combining events from two patterns (aka alignment) in Strudel.
The default method is 'in', meaning that patterns to the left will (typically) dictate the event timings when combined with patterns to the right.
By changing alignment to 'out', the opposite will happen. With 'mix', they will combine their event timings.

Note that we say the default method, because alignments can also be set explicitly with calls like
'add.mix', 'set.squeeze', etc.

Parameters:
- `method` (string) — Default join method to use. Options: 'in', 'out', 'mix', 'squeeze', 'squeezeout', 'reset', 'restart', 'poly'

```strudel
setDefaultJoin('mix') // also try 'in', 'out', 'squeeze', etc.
s("saw").vel("1 0.5").note("F A C E").delay("0 0.2 0.3")
```

## setGainCurve
Tags: amplitude, superdough

Apply a function to all gains provided in patterns. Can be used to rescale gain to be
quadratic, exponential, etc. rather than linear

Parameters:
- `function` (function) — to apply to all gain values

```strudel
setGainCurve((x) => x * x) // quadratic gain
s("bd*4").gain(0.5) // equivalent to 0.25 gain normally
```

## setMaxPolyphony
Tags: superdough

Set the max polyphony. If notes are ringing out via release then they will
start to die out in first-in-first-out order once the max polyphony has been hit

Parameters:
- `Max` (number) — polyphony. Defaults to 128

```strudel
setMaxPolyphony(4)
n(irand(24).seg(8)).scale("C#3:minor").room(1).release(4).gain(0.5)
```

## shape
Tags: distortion, superdough

(Deprecated) Wave shaping distortion. WARNING: can suddenly get unpredictably loud.
Please use distort instead, which has a more predictable response curve
second option in optional array syntax (ex: ".9:.5") applies a postgain to the output

Parameters:
- `distortion` (number | Pattern) — between 0 and 1

```strudel
s("bd sd [~ bd] sd,hh*8").shape("<0 .2 .4 .6 .8>")
```

## shiftInputBuffers
Tags: internals

Shift left content of input buffers to receive new web audio block

## shiftOutputBuffers
Tags: internals

Shift left content of output buffers to receive new web audio block

## shiftPeaks
Tags: internals

Shift peaks and regions of influence by pitchFactor into new specturm

## showFirstCycle
Tags: internals

More human-readable version of the firstCycleValues accessor.

## shrink
Tags: stepwise

Experimental

Progressively shrinks the pattern by 'n' steps until there's nothing left, or if a second value is given (using mininotation list syntax with :),
that number of times.
A positive number will progressively drop steps from the start of a pattern, and a negative number from the end.

```strudel
"tha dhi thom nam".shrink("1").sound()
.bank("mridangam")
```

```strudel
"tha dhi thom nam".shrink("-1").sound()
.bank("mridangam")
```

```strudel
"tha dhi thom nam".shrink("1 -1").sound().bank("mridangam").pace(4)
```

```strudel
note("0 1 2 3 4 5 6 7".scale("C:ritusen")).sound("folkharp")
   .shrink("1 -1").pace(8)
```

## shuffle
Tags: temporal

Slices a pattern into the given number of parts, then plays those parts in random order.
Each part will be played exactly once per cycle.

```strudel
note("c d e f").sound("piano").shuffle(4)
```

```strudel
seq("c d e f".shuffle(4), "g").note().sound("piano")
```

## silence
Tags: generators

Does absolutely nothing..

```strudel
silence // "~"
```

## sine
Tags: generators

A sine signal between 0 and 1.

```strudel
n(sine.segment(16).range(0,15))
.scale("C:minor")
```

## sine2
Tags: generators

A sine signal between -1 and 1 (like sine, but bipolar).

## sinefold
Tags: distortion, superdough

Wavefolding distortion composed with sinusoid

Parameters:
- `distortion` (number | Pattern) — amount of distortion to apply
- `volume` (number | Pattern) — linear postgain of the distortion

## slice
Tags: samples

Chops samples into the given number of slices, triggering those slices with a given pattern of slice numbers.
Instead of a number, it also accepts a list of numbers from 0 to 1 to slice at specific points.

```strudel
samples('github:tidalcycles/dirt-samples')
s("breaks165").slice(8, "0 1 <2 2*2> 3 [4 0] 5 6 7".every(3, rev)).slow(0.75)
```

```strudel
samples('github:tidalcycles/dirt-samples')
s("breaks125").fit().slice([0,.25,.5,.75], "0 1 1 <2 3>")
```

## slider
Tags: external_io, visualization

Displays a slider widget to allow the user manipulate a value

Parameters:
- `value` (number) — Initial value
- `min` (number) — Minimum value - optional, defaults to 0
- `max` (number) — Maximum value - optional, defaults to 1
- `step` (number) — Step size - optional

## slow
Synonyms: sparsity
Tags: temporal

Slow down a pattern over the given number of cycles. Like the "/" operator in mini notation.

Parameters:
- `factor` (number | Pattern) — slow down factor

```strudel
s("bd hh sd hh").slow(2) // s("[bd hh sd hh]/2")
```

## slowcat
Synonyms: cat
Tags: combiners

Concatenation: combines a list of patterns, switching between them successively, one per cycle.

```strudel
slowcat("e5", "b4", ["d5", "c5"])
```

## slowcatPrime
Tags: combiners

Concatenation: combines a list of patterns, switching between them successively, one per cycle. Unlike slowcat, this version will skip cycles.

Parameters:
- `items` (any) — The items to concatenate

## soft
Tags: distortion, superdough

Soft-clipping distortion

Parameters:
- `distortion` (number | Pattern) — amount of distortion to apply
- `volume` (number | Pattern) — linear postgain of the distortion

## someCycles
Tags: temporal

Shorthand for .someCyclesBy(0.5, fn)

```strudel
s("bd,hh*8").someCycles(x=>x.speed("0.5"))
```

## someCyclesBy
Tags: temporal

Randomly applies the given function by the given probability on a cycle by cycle basis.
Similar to sometimesBy

Parameters:
- `probability` (number | Pattern) — a number between 0 and 1
- `function` (function) — the transformation to apply

```strudel
s("bd,hh*8").someCyclesBy(.3, x=>x.speed("0.5"))
```

## sometimes
Tags: temporal

Applies the given function with a 50% chance

Parameters:
- `function` (function) — the transformation to apply

```strudel
s("hh*8").sometimes(x=>x.speed("0.5"))
```

## sometimesBy
Tags: temporal

Randomly applies the given function by the given probability.
Similar to someCyclesBy

Parameters:
- `probability` (number | Pattern) — a number between 0 and 1
- `function` (function) — the transformation to apply

```strudel
s("hh*8").sometimesBy(.4, x=>x.speed("0.5"))
```

## sortHapsByPart
Tags: internals

Returns a new pattern, which returns haps sorted in temporal order. Mainly
of use when comparing two patterns for equality, in tests.

## soundAlias
Tags: samples

Register an alias for a sound.

Parameters:
- `original` (string) — The original sound name
- `alias` (string) — The alias to use for the sound

## source
Synonyms: src
Tags: external_io, superdough

Define a custom webaudio node to use as a sound source.

Parameters:
- `getSource` (function)

## spectrum
Tags: visualization

Renders a spectrum analyzer for the incoming audio signal.

Parameters:
- `config` (object) — optional config with options:
- `thickness` (integer) — line thickness in px (default 3)
- `speed` (integer) — scroll speed (default 1)
- `min` (integer) — min db (default -80)
- `max` (integer) — max db (default 0)

```strudel
n("<0 4 <2 3> 1>*3")
.off(1/8, add(n(5)))
.off(1/5, add(n(7)))
.scale("d3:minor:pentatonic")
.s('sine')
.dec(.3).room(.5)
._spectrum()
```

## speed
Tags: pitch, samples

Changes the speed of sample playback, i.e. a cheap way of changing pitch.

Parameters:
- `speed` (number | Pattern) — inf to inf, negative numbers play the sample backwards.

```strudel
s("bd*6").speed("1 2 4 1 -2 -4")
```

```strudel
speed("1 1.5*2 [2 1.1]").s("piano").clip(1)
```

## spiral
Tags: visualization

Displays a spiral visual.

Parameters:
- `options` (Object) — Object containing all the optional following parameters as key value pairs:
- `stretch` (number) — controls the rotations per cycle ratio, where 1 = 1 cycle / 360 degrees
- `size` (number) — the diameter of the spiral
- `thickness` (number) — line thickness
- `cap` (string) — style of line ends: butt (default), round, square
- `inset` (string) — number of rotations before spiral starts (default 3)
- `playheadColor` (string) — color of playhead, defaults to white
- `playheadLength` (number) — length of playhead in rotations, defaults to 0.02
- `playheadThickness` (number) — thickness of playheadrotations, defaults to thickness
- `padding` (number) — space around spiral
- `steady` (number) — steadyness of spiral vs playhead. 1 = spiral doesn't move, playhead does.
- `activeColor` (number) — color of active segment. defaults to foreground of theme
- `inactiveColor` (number) — color of inactive segments. defaults to gutterForeground of theme
- `colorizeInactive` (boolean) — wether or not to colorize inactive segments, defaults to 0
- `fade` (boolean) — wether or not past and future should fade out. defaults to 1
- `logSpiral` (boolean) — wether or not the spiral should be logarithmic. defaults to 0

```strudel
note("c2 a2 eb2")
.euclid(5,8)
.s('sawtooth')
.lpenv(4).lpf(300)
._spiral({ steady: .96 })
```

## splice
Tags: samples, pitch

Works the same as slice, but changes the playback speed of each slice to match the duration of its step.

```strudel
samples('github:tidalcycles/dirt-samples')
s("breaks165")
.splice(8,  "0 1 [2 3 0]@2 3 0@2 7")
```

## splitQueries
Tags: internals

Returns a new pattern, with queries split at cycle boundaries. This makes
some calculations easier to express, as all haps are then constrained to
happen within a cycle.

## spread
Tags: superdough

Set the stereo pan spread for supported oscillators

Parameters:
- `spread` (number | Pattern) — between 0 and 1

```strudel
note("d f a a# a d3").fast(2).s("supersaw").spread("<0 .3 1>")
```

## square
Tags: generators

A square signal between 0 and 1.

```strudel
n(square.segment(4).range(0,7)).scale("C:minor")
```

## square2
Tags: generators

A square signal between -1 and 1 (like square, but bipolar).

## squeeze
Tags: combiners

Pick from the list of values (or patterns of values) via the index using the given
pattern of integers. The selected pattern will be compressed to fit the duration of the selecting event

Parameters:
- `pat` (Pattern)
- `xs` (*)

```strudel
note(squeeze("<0@2 [1!2] 2>", ["g a", "f g f g" , "g a c d"]))
```

## stack
Synonyms: polyrhythm, pr
Tags: temporal

The given items are played at the same time at the same length.

```strudel
stack("g3", "b3", ["e4", "d4"]).note()
// "g3,b3,[e4 d4]".note()
```

```strudel
// As a chained function:
s("hh*4").stack(
  note("c4(5,8)")
)
```

## stepalt
Tags: stepwise

Experimental

Concatenates patterns stepwise, according to an inferred 'steps per cycle'.
Similar to stepcat, but if an argument is a list, the whole pattern will alternate between the elements in the list.

```strudel
stepalt(["bd cp", "mt"], "bd").sound()
// The same as "bd cp bd mt bd".sound()
```

## stepcat
Synonyms: timeCat, timecat
Tags: stepwise

'Concatenates' patterns like fastcat, but proportional to a number of steps per cycle.
The steps can either be inferred from the pattern, or provided as a [length, pattern] pair.
Has the alias timecat.

```strudel
stepcat([3,"e3"],[1, "g3"]).note()
// the same as "e3@3 g3".note()
```

```strudel
stepcat("bd sd cp","hh hh").sound()
// the same as "bd sd cp hh hh".sound()
```

## stretch
Tags: pitch, samples

Changes the pitch of the sample without changing its speed.
The frequencies are multiplied by (factor + 1) for positive numbers
and by max(factor / 4 + 1, 0) for negative numbers.
So tuning up by octaves can be done with 1, 3, 7, ...
and tuning down by octaves with -2, -3, -3.5...

Parameters:
- `factor` (number | Pattern) — between -4 and inf. Positive increases pitch, 0 does nothing, negative decreases the pitch.

```strudel
s("gm_flute").stretch("<2 1 0 -2>")
```

## striate
Tags: samples

Cuts each sample into the given number of parts, triggering progressive portions of each sample at each loop.

```strudel
s("numbers:0 numbers:1 numbers:2").striate(6).slow(3)
```

## stripContext
Tags: internals

Returns a new pattern with the context field of every hap set to an empty object.

## struct
Tags: temporal

Applies the given structure to the pattern:

```strudel
note("c,eb,g")
  .struct("x ~ x ~ ~ x ~ x ~ ~ ~ x ~ x ~ ~")
  .slow(2)
```

## stut
Tags: temporal

Deprecated. Like echo, but the last 2 parameters are flipped.

Parameters:
- `times` (number) — how many times to repeat
- `feedback` (number) — velocity multiplicator for each iteration
- `time` (number) — cycle offset between iterations

```strudel
s("bd sd").stut(3, .8, 1/6)
```

## sub
Tags: math

Like add, but the given numbers are subtracted.

```strudel
n("0 2 4".sub("<0 1 2 3>")).scale("C4:minor")
// See add for more information.
```

## superimpose
Tags: combiners

Superimposes the result of the given function(s) on top of the original pattern:

```strudel
"<0 2 4 6 ~ 4 ~ 2 0!3 ~!5>*8"
  .superimpose(x=>x.add(2))
  .scale('C minor').note()
```

## sustain
Synonyms: sus
Tags: amplitude, envelope, superdough

Amplitude envelope sustain level: The level which is reached after attack / decay, being sustained until the offset.

Parameters:
- `gain` (number | Pattern) — sustain level between 0 and 1

```strudel
note("c3 e3 f3 g3").decay(.2).sustain("<0 .1 .4 .6 1>")
```

## swing
Tags: temporal

Shorthand for swingBy with 1/3:

Parameters:
- `subdivision` (number)

```strudel
s("hh*8").swing(4)
// s("hh*8").swingBy(1/3, 4)
```

## swingBy
Tags: temporal

The function swingBy x n breaks each cycle into n slices, and then delays events in the second half of each slice by the amount x, which is relative to the size of the (half) slice. So if x is 0 it does nothing, 0.5 delays for half the note duration, and 1 will wrap around to doing nothing again. The end result is a shuffle or swing-like rhythm

Parameters:
- `subdivision` (number)
- `offset` (number)

```strudel
s("hh*8").swingBy(1/3, 4)
```

## sysex
Tags: external_io, midi

MIDI sysex: Sends a MIDI sysex message.

Parameters:
- `id` (number | Pattern) — Sysex ID
- `data` (number | Pattern) — Sysex data

```strudel
note("c4").sysex(["0x77", "0x01:0x02:0x03:0x04"]).midichan(1).midi()
```

## sysexdata
Tags: external_io, midi

MIDI sysex data: Sends a MIDI sysex message.

Parameters:
- `data` (number | Pattern) — Sysex data

```strudel
note("c4").sysexid("0x77").sysexdata("0x01:0x02:0x03:0x04").midichan(1).midi()
```

## sysexid
Tags: external_io, midi

MIDI sysex ID: Sends a MIDI sysex identifier message.

Parameters:
- `id` (number | Pattern) — Sysex ID

```strudel
note("c4").sysexid("0x77").sysexdata("0x01:0x02:0x03:0x04").midichan(1).midi()
```

## tables
Tags: wavetable

Loads a collection of wavetables to use with s

## tag
Tags: temporal

Tags each Hap with an identifier. Good for filtering. The function populates Hap.context.tags (Array).

Parameters:
- `tag` (string) — anything unique

```strudel
s("saw!16").note("F1")
  .lpf(tri.range(40, 80).slow(4)).lpenv(5).lpq(4).lpd(0.15)
  .when(rand.late(0.1).gte(0.5), x => x.transpose("12").tag('altered'))
  .when(rand.late(0.2).gte(0.5), x => x.s("square").tag('altered'))
  .when("<0 1>", x => x.filter((hap) => hap.hasTag('altered')))
```

## take
Tags: stepwise

Experimental

Takes the given number of steps from a pattern (dropping the rest).
A positive number will take steps from the start of a pattern, and a negative number from the end.

```strudel
"bd cp ht mt".take("2").sound()
// The same as "bd cp".sound()
```

```strudel
"bd cp ht mt".take("1 2 3").sound()
// The same as "bd bd cp bd cp ht".sound()
```

```strudel
"bd cp ht mt".take("-1 -2 -3").sound()
// The same as "mt ht mt cp ht mt".sound()
```

## time
Tags: generators

A signal representing the cycle time.

## timecat

Aliases for stepcat

## toBipolar
Tags: math

Assumes a numerical pattern, containing unipolar values in the range 0 ..

Returns a new pattern with values scaled to the bipolar range -1 .. 1

## tour
Tags: stepwise

Experimental

Inserts a pattern into a list of patterns. On the first repetition it will be inserted at the end of the list, then moved backwards through the list
on successive repetitions. The patterns are added together stepwise, with all repetitions taking place over a single cycle. Using pace to set the
number of steps per cycle is therefore usually recommended.

```strudel
"[c g]".tour("e f", "e f g", "g f e c").note()
   .sound("folkharp")
   .pace(8)
```

## transient
Tags: superdough

Transient shaper. Gives independent control over the emphasis on transients
and sustains

Parameters:
- `attack` (number | Pattern) — Emphasis on transients; between -1 (deaccentuate) and 1 (accentuate)
- `sustain` (number | Pattern) — Emphasis on the sustains; between -1 (deaccentuate) and 1 (accentuate)

```strudel
s("bd").transient("<-1 -0.5 0 0.5 1>")
```

```strudel
s("hh*16").bank("tr909").transient("<-1:1 1:-1>")
```

## transpose
Synonyms: trans
Tags: tonal

Change the pitch of each value by the given amount. Expects numbers or note strings as values.
The amount can be given as a number of semitones or as a string in interval short notation.
If you don't care about enharmonic correctness, just use numbers. Otherwise, pass the interval of
the form: ST where S is the degree number and T the type of interval with

M = major
m = minor
P = perfect
A = augmented
d = diminished

Examples intervals:

1P = unison
3M = major third
3m = minor third
4P = perfect fourth
4A = augmented fourth
5P = perfect fifth
5d = diminished fifth

Parameters:
- `amount` (string | number) — Either number of semitones or interval string.

```strudel
"c2 c3".fast(2).transpose("<0 -2 5 3>".slow(2)).note()
```

```strudel
"c2 c3".fast(2).transpose("<1P -2M 4P 3m>".slow(2)).note()
```

## tremolo
Synonyms: trem
Tags: amplitude, lfo, superdough

Modulate the amplitude of a sound with a continuous waveform

Parameters:
- `speed` (number | Pattern) — modulation speed in HZ

```strudel
note("d d d# d".fast(4)).s("supersaw").tremolo("<3 2 100> ").tremoloskew("<.5>")
```

## tremolodepth
Synonyms: tremdepth
Tags: amplitude, lfo, superdough

Depth of amplitude modulation

Parameters:
- `depth` (number | Pattern)

```strudel
note("a1 a1 a#1 a1".fast(4)).s("pulse").tremsync(4).tremolodepth("<1 2 .7>")
```

## tremolophase
Synonyms: tremphase
Tags: amplitude, lfo, superdough

Alter the phase of the modulation waveform

Parameters:
- `offset` (number | Pattern) — the offset in cycles of the modulation

```strudel
note("{f a c e}%16").s("sawtooth").tremsync(4).tremolophase("<0 .25 .66>")
```

## tremoloshape
Synonyms: tremshape
Tags: amplitude, lfo, superdough

Shape of amplitude modulation

Parameters:
- `shape` (number | Pattern) — tri | square | sine | saw | ramp

```strudel
note("{f g c d}%16").tremsync(4).tremoloshape("<sine tri square>").s("sawtooth")
```

## tremoloskew
Synonyms: tremskew
Tags: amplitude, lfo, superdough

Alter the shape of the modulation waveform

Parameters:
- `amount` (number | Pattern) — between 0 & 1, the shape of the waveform

```strudel
note("{f a c e}%16").s("sawtooth").tremsync(4).tremoloskew("<.5 0 1>")
```

## tremolosync
Synonyms: tremsync
Tags: amplitude, lfo, superdough

Modulate the amplitude of a sound with a continuous waveform

Parameters:
- `cycles` (number | Pattern) — modulation speed in cycles

```strudel
note("d d d# d".fast(4)).s("supersaw").tremolosync("4").tremoloskew("<1 .5 0>")
```

## tri
Tags: generators

A triangle signal between 0 and 1.

```strudel
n(tri.segment(8).range(0,7)).scale("C:minor")
```

## tri2
Tags: generators

A triangle signal between -1 and 1 (like tri, but bipolar).

## tune
Tags: tonal

Assumes pattern contains numerical scale degrees on the i control (see examples below). Accepts a scale name or list of frequencies (see all available names at the link on the reference). Returns a new pattern with all values mapped to a frequency ratio. Similar to xen.

Parameters:
- `scale` (string | Array.<number>)

```strudel
i("0 1 2 3 4 5").tune("hexany15").mul("220").freq()
```

```strudel
// You can set your root to be a
// particular note with getFreq:
i("4 8 9 10 - - 5 7 9 11 - -").tune("tranh3")
  .mul(getFreq('c3'))
  .freq().clip(.5).room(1)
```

```strudel
// You can also give tune a list of
// frequencies to use as the scale:
i("0 1 2 3 4").tune([
  261.6255653006,
  302.72962012827,
  350.29154279212,
  405.32593044476,
  469.00678383895,
  523.2511306012
]).mul(220).freq();
```

## undegrade
Tags: temporal

Inverse of degrade: Randomly removes 50% of events from the pattern. Shorthand for .undegradeBy(0.5)
Events that would be removed by degrade are let through by undegrade and vice versa (see second example).

```strudel
s("hh*8").undegrade()
```

```strudel
s("hh*10").layer(
  x => x.degrade().pan(0),
  x => x.undegrade().pan(1)
)
```

## undegradeBy
Tags: temporal

Inverse of degradeBy: Randomly removes events from the pattern by a given amount.
0 = 100% chance of removal
1 = 0% chance of removal
Events that would be removed by degradeBy are let through by undegradeBy and vice versa (see second example).

Parameters:
- `amount` (number) — a number between 0 and 1

```strudel
s("hh*8").undegradeBy(0.2)
```

```strudel
s("hh*10").layer(
  x => x.degradeBy(0.2).pan(0),
  x => x.undegradeBy(0.8).pan(1)
)
```

## unison
Tags: superdough

Set number of stacked voices for supported oscillators.

Parameters:
- `numvoices` (number | Pattern)

```strudel
note("d f a a# a d3").fast(2).s("supersaw").unison("<1 2 7>")
```

## useRNG
Tags: generators, math

Sets which random number generator to use. Historically Strudel would
use useRNG('legacy'), which remains the default. To use a new more statistically
precise RNG, try useRNG('precise').

Parameters:
- `mod` (string) — Mode. One of 'legacy', 'precise'

```strudel
useRNG('legacy')
// Repeats every 300 cycles
$: n(irand(50)).seg(16).scale("C:minor").ribbon(88, 32)
$: n(irand(50)).seg(16).scale("C:minor").ribbon(388, 32)
```

## velocity
Synonyms: vel
Tags: amplitude, superdough

Sets the velocity from 0 to 1. Is multiplied together with gain.

```strudel
s("hh*8")
.gain(".4!2 1 .4!2 1 .4 1")
.velocity(".4 1")
```

## vib
Synonyms: vibrato, v
Tags: pitch, lfo, superdough

Applies a vibrato to the frequency of the oscillator.

Parameters:
- `frequency` (number | Pattern) — of the vibrato in hertz

```strudel
note("a e")
.vib("<.5 1 2 4 8 16>")
._scope()
```

```strudel
// change the modulation depth with ":"
note("a e")
.vib("<.5 1 2 4 8 16>:12")
._scope()
```

## vibmod
Synonyms: vmod
Tags: pitch, lfo, superdough

Sets the vibrato depth in semitones. Only has an effect if vibrato | vib | v is is also set

Parameters:
- `depth` (number | Pattern) — of vibrato (in semitones)

```strudel
note("a e").vib(4)
.vibmod("<.25 .5 1 2 12>")
._scope()
```

```strudel
// change the vibrato frequency with ":"
note("a e")
.vibmod("<.25 .5 1 2 12>:8")
._scope()
```

## voicing
Tags: tonal

Turns chord symbols into voicings. You can use the following control params:

chord: Note, followed by chord symbol, e.g. C Am G7 Bb^7
dict: voicing dictionary to use, falls back to default dictionary
anchor: the note that is used to align the chord
mode: how the voicing is aligned to the anchor

below: top note <= anchor
duck: top note <= anchor, anchor excluded
above: bottom note >= anchor

offset: whole number that shifts the voicing up or down to the next voicing
n: if set, the voicing is played like a scale. Overshooting numbers will be octaved

All of the above controls are optional, except chord.
If you pass a pattern of strings to voicing, they will be interpreted as chords.

```strudel
n("0 1 2 3").chord("<C Am F G>").voicing()
```

## voicings
Tags: tonal

DEPRECATED: still works, but it is recommended you use .voicing instead (without s).
Turns chord symbols into voicings, using the smoothest voice leading possible.
Uses chord-voicings package.

Parameters:
- `dictionary` (string) — which voicing dictionary to use.

```strudel
stack("<C^7 A7 Dm7 G7>".voicings('lefthand'), "<C3 A2 D3 G2>").note()
```

## vowel
Tags: superdough

Formant filter to make things sound like vowels.

Parameters:
- `vowel` (string | Pattern) — You can use a e i o u ae aa oe ue y uh un en an on, corresponding to [a] [e] [i] [o] [u] [æ] [ɑ] [ø] [y] [ɯ] [ʌ] [œ̃] [ɛ̃] [ɑ̃] [ɔ̃]. Aliases: aa = å = ɑ, oe = ø = ö, y = ı, ae = æ.

```strudel
note("[c2 <eb2 <g2 g1>>]*2").s('sawtooth')
.vowel("<a e i <o u>>")
```

```strudel
s("bd sd mt ht bd [~ cp] ht lt").vowel("[a|e|i|o|u]")
```

## warp
Synonyms: wavetableWarp
Tags: wavetable, superdough

Amount of warp (alteration of the waveform) to apply to the wavetable oscillator

Parameters:
- `amount` (number | Pattern) — Warp of the wavetable from 0 to 1

```strudel
s("basique").bank("wt_digital").seg(8).note("F1").warp("0 0.25 0.5 0.75 1")
  .warpmode("spin")
```

## warpattack
Synonyms: warpatt
Tags: wavetable, envelope, superdough

Attack time of the wavetable oscillator's warp envelope

Parameters:
- `time` (number | Pattern) — attack time in seconds

## warpdc
Tags: wavetable, lfo, superdough

DC offset of the LFO for the wavetable oscillator's warp

Parameters:
- `dcoffset` (number | Pattern) — dc offset. set to 0 for unipolar

## warpdecay
Synonyms: warpdec
Tags: wavetable, envelope, superdough

Decay time of the wavetable oscillator's warp envelope

Parameters:
- `time` (number | Pattern) — decay time in seconds

## warpdepth
Tags: wavetable, lfo, superdough

Depth of the LFO for the wavetable oscillator's warp

Parameters:
- `depth` (number | Pattern) — depth of modulation

## warpenv
Tags: wavetable, envelope, superdough

Amount of envelope applied wavetable oscillator's position envelope

Parameters:
- `amount` (number | Pattern) — between 0 and 1

## warpmode
Synonyms: wavetableWarpMode
Tags: wavetable, superdough

Type of warp (alteration of the waveform) to apply to the wavetable oscillator.

The current options are: none, asym, bendp, bendm, bendmp, sync, quant, fold, pwm, orbit,
spin, chaos, primes, binary, brownian, reciprocal, wormhole, logistic, sigmoid, fractal, flip

Parameters:
- `mode` (number | string | Pattern) — Warp mode

```strudel
s("morgana").bank("wt_digital").seg(8).note("F1").warp("0 0.25 0.5 0.75 1")
  .warpmode("<asym bendp spin logistic sync wormhole brownian>*2")
```

## warprate
Tags: wavetable, lfo, superdough

Rate of the LFO for the wavetable oscillator's warp

Parameters:
- `rate` (number | Pattern) — rate in hertz

## warprelease
Synonyms: warprel
Tags: wavetable, envelope, superdough

Release time of the wavetable oscillator's warp envelope

Parameters:
- `time` (number | Pattern) — release time in seconds

## warpshape
Tags: wavetable, lfo, superdough

Shape of the LFO for the wavetable oscillator's warp

Parameters:
- `shape` (number | Pattern) — Shape of the lfo (0, 1, 2, ..)

## warpskew
Tags: wavetable, lfo, superdough

Skew of the LFO for the wavetable oscillator's warp

Parameters:
- `skew` (number | Pattern) — How much to bend the LFO shape

## warpsustain
Synonyms: warpsus
Tags: wavetable, envelope, superdough

Sustain time of the wavetable oscillator's warp envelope

Parameters:
- `gain` (number | Pattern) — sustain level (0 to 1)

## warpsync
Tags: wavetable, lfo, superdough

cycle synced rate of the LFO for the wavetable warp position

Parameters:
- `rate` (number | Pattern) — rate in cycles

## wchoose
Tags: temporal

Chooses randomly from the given list of elements by giving a probability to each element

Parameters:
- `pairs` (any) — arrays of value and weight

```strudel
note("c2 g2!2 d2 f1").s(wchoose(["sine",10], ["triangle",1], ["bd:6",1]))
```

## wchooseCycles
Synonyms: wrandcat
Tags: temporal

Picks one of the elements at random each cycle by giving a probability to each element

```strudel
wchooseCycles(["bd",10], ["hh",1], ["sd",1]).s().fast(8)
```

```strudel
wchooseCycles(["c c c",5], ["a a a",3], ["f f f",1]).fast(4).note()
```

```strudel
// The probability can itself be a pattern
wchooseCycles(["bd(3,8)","<5 0>"], ["hh hh hh",3]).fast(4).s()
```

## when
Tags: temporal

Applies the given function whenever the given pattern is in a true state.

Parameters:
- `binary_pat` (Pattern)
- `func` (function)

```strudel
"c3 eb3 g3".when("<0 1>/2", x=>x.sub("5")).note()
```

## whenKey
Tags: external_io

Do something on a keypress, or array of keypresses
Key name reference

```strudel
s("bd(5,8)").whenKey("Control:j", x => x.segment(16).color("red")).whenKey("Control:i", x => x.fast(2).color("blue"))
```

## withBase
Tags: tonal

Assumes pattern of frequencies tuned to some base frequency, such as the output of xen
Because xen defaults to 220Hz, so will withBase.
but you can specify a different original base with the standard optional array syntax ':'

Parameters:
- `base` (number)
- `(optional)` (number) — originalBase

```strudel
i("[0 1 2 3] [3 4] [4 3 2 1]").xen("hexany23").withBase("<220 [300 200]>")
```

```strudel
mini([1 / 1, 16 / 15, 9 / 8, 6 / 5, 5 / 4].join(' ')).withBase("220:1")
// mini([1 / 1, 16 / 15, 9 / 8, 6 / 5, 5 / 4].join(' ')).mul(220).freq()
```

## withContext
Tags: internals

Returns a new pattern with the given function applied to the context field of every hap.

Parameters:
- `func` (function)

## withHap
Tags: internals

As with withHaps, but applies the function to every hap, rather than every list of haps.

Parameters:
- `func` (function)

## withHaps
Tags: internals

Returns a new pattern with the given function applied to the list of haps returned by every query.

Parameters:
- `func` (function)

## withHapSpan
Tags: internals

Similar to withQuerySpan, but the function is applied to the timespans
of all haps returned by pattern queries (both part timespans, and where
present, whole timespans).

Parameters:
- `func` (function)

## withHapTime
Tags: internals

As with withHapSpan, but the function is applied to both the
begin and end time of the hap timespans.

Parameters:
- `func` (function) — the function to apply

## within
Tags: temporal, functional

Use within to apply a function to only a part of a pattern.

Parameters:
- `start` (number) — start within cycle (0 - 1)
- `end` (number) — end within cycle (0 - 1). Must be > start
- `func` (function) — function to be applied to the sub-pattern

## withLoc
Tags: internals

Returns a new pattern with the given location information added to the
context of every hap.

Parameters:
- `start` (Number) — start offset
- `end` (Number) — end offset

## withQuerySpan
Tags: internals

Returns a new pattern, where the given function is applied to the query
timespan before passing it to the original pattern.

Parameters:
- `func` (function) — the function to apply

## withQueryTime
Tags: internals

As with withQuerySpan, but the function is applied to both the
begin and end time of the query timespan.

Parameters:
- `func` (function) — the function to apply

## withSeed
Tags: math

Modify a pattern by applying a function to the randomSeed control if present

Parameters:
- `func` (function) — Function from seed (or undefined) to seed (or undefined)
- `pat` (Pattern) — Pattern to update

## withValue
Synonyms: fmap
Tags: functional

Returns a new pattern, with the function applied to the value of
each hap. It has the alias fmap.

Parameters:
- `func` (function) — to to apply to the value

```strudel
"0 1 2".withValue(v => v + 10).log()
```

## wordfall
Tags: visualization

Displays a vertical pianoroll with event labels.
Supports all the same options as pianoroll.

## worklet

Creates a worklet effect. Typically derived by writing K(...) in the REPL which will parse
Kabelsalat code.

Parameters:
- `src` (string) — Source code of the worklet update function
- `inputs` (number | Pattern) — Worklet inputs

## writeOutputs
Tags: internals

Write next web audio block from output buffers

## wt
Synonyms: wavetablePosition
Tags: wavetable, superdough

Position in the wavetable of the wavetable oscillator

Parameters:
- `position` (number | Pattern) — Position in the wavetable from 0 to 1

```strudel
s("squelch").bank("wt_digital").seg(8).note("F1").wt("0 0.25 0.5 0.75 1")
```

## wtattack
Synonyms: wtatt
Tags: wavetable, envelope, superdough

Attack time of the wavetable oscillator's position envelope

Parameters:
- `time` (number | Pattern) — attack time in seconds

## wtdc
Tags: wavetable, lfo, superdough

DC offset of the LFO for the wavetable oscillator's position

Parameters:
- `dcoffset` (number | Pattern) — dc offset. set to 0 for unipolar

## wtdecay
Synonyms: wtdec
Tags: wavetable, envelope, superdough

Decay time of the wavetable oscillator's position envelope

Parameters:
- `time` (number | Pattern) — decay time in seconds

## wtdepth
Tags: wavetable, lfo, superdough

Depth of the LFO for the wavetable oscillator's position

Parameters:
- `depth` (number | Pattern) — depth of modulation

## wtenv
Tags: wavetable, envelope, superdough

Amount of envelope applied wavetable oscillator's position envelope

Parameters:
- `amount` (number | Pattern) — between 0 and 1

## wtphaserand
Synonyms: wavetablePhaseRand
Tags: wavetable, superdough

Amount of randomness of the initial phase of the wavetable oscillator.

Parameters:
- `amount` (number | Pattern) — Randomness of the initial phase. Between 0 (not random) and 1 (fully random)

```strudel
s("basique").bank("wt_digital").seg(16).wtphaserand("<0 1>")
```

## wtrate
Tags: wavetable, lfo, superdough

Rate of the LFO for the wavetable oscillator's position

Parameters:
- `rate` (number | Pattern) — rate in hertz

## wtrelease
Synonyms: wtrel
Tags: wavetable, envelope, superdough

Release time of the wavetable oscillator's position envelope

Parameters:
- `time` (number | Pattern) — release time in seconds

## wtshape
Tags: wavetable, lfo, superdough

Shape of the LFO for the wavetable oscillator's position

Parameters:
- `shape` (number | Pattern) — Shape of the lfo (0, 1, 2, ..)

## wtskew
Tags: wavetable, lfo, superdough

Skew of the LFO for the wavetable oscillator's position

Parameters:
- `skew` (number | Pattern) — How much to bend the LFO shape

## wtsustain
Synonyms: wtsus
Tags: wavetable, envelope, superdough

Sustain time of the wavetable oscillator's position envelope

Parameters:
- `gain` (number | Pattern) — sustain level (0 to 1)

## wtsync
Tags: wavetable, lfo, superdough

cycle synced rate of the LFO for the wavetable oscillator's position

Parameters:
- `rate` (number | Pattern) — rate in cycles

## xen
Tags: tonal

Assumes a numerical pattern of scale steps, and a scale. Scales accepted are all preset scale names of tune, arbitrary edos such as 31edo, or an array of frequency ratios. Assumes scales repeat at octave (2/1). Returns a new pattern with all values mapped to their associated frequency, assuming a base frequency of 220hz.

Parameters:
- `scaleNameOrRatios` (string | Array.<number>)

```strudel
// A minor triad in 31edo:
i("0 8 18").xen("31edo").piano()
```

```strudel
// You can also use xen with frequency ratios.
// This is equivalent to the above:
i("0 1 2").xen([
  Math.pow(2, 0/31),
  Math.pow(2, 8/31),
  Math.pow(2, 18/31),
]).piano()
```

```strudel
// xen also supports all scale names that
// tune does:
i("0 1 2 3 4 5").xen("hexany15")
// equiv to:
// "0 1 2 3 4 5".tune("hexany15").mul("220").freq()
```

```strudel
i("0 1 2 3 4 5 6 7").xen("<5edo 10edo 15edo hexany15>")
```

## xfade
Tags: amplitude

Cross-fades between left and right from 0 to 1:

0 = (full left, no right)
.5 = (both equal)
1 = (no left, full right)

```strudel
xfade(s("bd*2"), "<0 .25 .5 .75 1>", s("hh*8"))
```

## zip
Tags: stepwise

Experimental

'zips' together the steps of the provided patterns. This can create a long repetition, taking place over a single, dense cycle.
Using pace to set the number of steps per cycle is therefore usually recommended.

```strudel
zip("e f", "e f g", "g [f e] a f4 c").note()
   .sound("folkharp")
   .pace(8)
```

## zoom
Tags: temporal

Plays a portion of a pattern, specified by the beginning and end of a time span. The new resulting pattern is played over the time period of the original pattern:

```strudel
s("bd*2 hh*3 [sd bd]*2 perc").zoom(0.25, 0.75)
// s("hh*3 [sd bd]*2") // equivalent
```
