# Strudel Code Examples

## 1. Techno Bass Fugue

**Prompt:** Generate a techno bass fugue built from electric bass samples in a minor scale. Create a repeating but evolving bass motif using nested rhythmic groupings and polymetric subdivisions. Layer the motif with transposed entries to suggest contrapuntal voices, like a fugue. Introduce call-and-response variations via short delays, echoes, and occasional interval jumps. Shape the tone with slow, evolving low-pass filter sweeps and high resonance for a dub-influenced, hypnotic feel. Support the bass with a minimal, steady kick-snare-hi-hat groove that keeps it club-ready. The overall result should feel algorithmic, precise, and constantly mutating while remaining tight and danceable.

```strudel
samples({ flbass: ['00_c2_finger_long_neck.wav','01_c2_finger_short_neck.wav','02_c2_finger_long_bridge.wav','03_c2_finger_short_bridge.wav','04_c2_pick_long.wav','05_c2_pick_short.wav','06_c2_palm_mute.wav'] }, 
  'github:cleary/samples-flbass/main/')
samples({
bd: ['bd/BT0AADA.wav','bd/BT0AAD0.wav','bd/BT0A0DA.wav','bd/BT0A0D3.wav','bd/BT0A0D0.wav','bd/BT0A0A7.wav'],
sd: ['sd/rytm-01-classic.wav','sd/rytm-00-hard.wav'],
hh: ['hh27/000_hh27closedhh.wav','hh/000_hh3closedhh.wav'],
}, 'github:tidalcycles/dirt-samples');

setcps(1)

"<8(3,8) <7 7*2> [4 5@3] 8>".sub(1) // sub 1 -> 1-indexed
.layer(
x=>x,
x=>x.add(7)
.off(1/8,x=>x.add("2,4").off(1/8,x=>x.add(5).echo(4,.125,.5)))
.slow(2),
).n().scale('A1 minor')
.s("flbass").n(0)
.mul(gain(.3))
.cutoff(sine.slow(7).range(200,4000))
.resonance(10)
//.hcutoff(400)
.clip(1)
.stack(s("bd:1*2,~ sd:0,[~ hh:0]*2"))
.pianoroll({vertical:1})
```

## 2. Blippy Rhodes Jazz-Techno

**Prompt:** Generate a playful, blippy Rhodes-led groove with a jazzy–electronic feel. Use a bright electric piano as the main voice, playing short, syncopated motifs that loop and mutate. Move fluidly between major, mixolydian, lydian, and occasional minor harmonies for a colorful, shifting mood. Apply rhythmic gating and subtle pitch offsets to give the notes a bouncy, glitch-adjacent character. Add space with small-room reverb and tempo-synced delays that create soft echoes without washing out the groove. Support the melody with a simple but punchy kick, snare, and hi-hat pattern, plus a warm, filtered bass underneath. The overall result should feel light, playful, harmonically rich, and rhythmically tight—like blippy jazz-techno with sparkle.

```strudel
samples({
  bd: 'samples/tidal/bd/BT0A0D0.wav',
  sn: 'samples/tidal/sn/ST0T0S3.wav',
  hh: 'samples/tidal/hh/000_hh3closedhh.wav',
  rhodes: {
  E1: 'samples/rhodes/MK2Md2000.mp3',
  E2: 'samples/rhodes/MK2Md2012.mp3',
  E3: 'samples/rhodes/MK2Md2024.mp3',
  E4: 'samples/rhodes/MK2Md2036.mp3',
  E5: 'samples/rhodes/MK2Md2048.mp3',
  E6: 'samples/rhodes/MK2Md2060.mp3',
  E7: 'samples/rhodes/MK2Md2072.mp3'
  }
}, 'https://loophole-letters.vercel.app/')

stack(
  s("<bd sn> <hh hh*2 hh*3>").color('#00B8D4'),
  "<g4 c5 a4 [ab4 <eb5 f5>]>"
  .scale("<C:major C:mixolydian F:lydian [F:minor <Db:major Db:mixolydian>]>")
  .struct("x*8")
  .scaleTranspose("0 [-5,-2] -7 [-9,-2]")
  .slow(2)
  .note()
  .clip(.3)
  .s('rhodes')
  .room(.5)
  .delay(.3)
  .delayfeedback(.4)
  .delaytime(1/12).gain(.5).color('#7ED321'),
  "<c2 c3 f2 [[F2 C2] db2]>/2"
  .add("0,.02")
  .note().gain(.3)
  .clip("<1@3 [.3 1]>/2")
  .cutoff(600)
  .lpa(.2).lpenv(-4)
  .s('sawtooth').color('#F8E71C'),
).fast(3/2)
```

## 3. Minimal Piano

**Prompt:** Generate a minimal, melodic piano pattern in a minor key with a hypnotic, generative feel. Build a short motif from simple scale degrees and repeat it using uneven rhythmic groupings to create subtle polyrhythms. Introduce delayed harmonic shadows by offsetting transposed copies of the motif at different time intervals. Use tempo-synced echoes to blur the line between rhythm and harmony while keeping the pattern clear and restrained. Keep the sound intimate and percussive, like a dry piano in a small space. The result should feel calm, mathematical, and quietly emotional—minimalism with motion.

```strudel
n("<0 2 [4 6](3,4,2) 3*2>").color('salmon')
.off(1/4, x=>x.add(n(2)).color('green'))
.off(1/2, x=>x.add(n(6)).color('steelblue'))
.scale('D minor')
.echo(4, 1/8, .5)
.clip(.5)
.piano()
.pianoroll()
```

## 4. Club-Jazz Csound Groove

**Prompt:** Generate a live-coded jazz–electronic groove built around rich seventh chords and a steady rhythmic pulse. Use lush, voiced jazz chords that cycle slowly, with evolving timbral movement driven by gradual filter changes. Add a repeating, octave-anchored bass line that locks tightly to the harmony and reinforces the groove. Introduce a syncopated melodic figure that weaves around the chords, occasionally shifting intervals for variation. Keep the rhythm precise and mechanical but let the harmony feel warm and expressive. Ground everything with a classic drum-machine pattern—kick, hi-hat, and clap—for a late-night, club-jazz feel. The result should sit between algorithmic precision and soulful jazz harmony.

```strudel
await loadOrc('github:kunstmusik/csound-live-code/master/livecode.orc')

stack(
  chord("<C^7 A7 Dm7 Fm7>/2").dict('lefthand').voicing()
  .cutoff(sine.range(500,2000).round().slow(16))
  .euclidLegato(3,8).csound('FM1')
  ,
  note("<C2 A1 D2 F2>/2").ply(8).csound('Bass').gain("1 4 1 4")
  ,
  n("0 7 [4 3] 2".fast(2/3).off(".25 .125", add("<2 4 -3 -1>"))
  .slow(2).scale('A4 minor'))
  .clip(.25).csound('SynHarp')
  ,
  s("bd*2,[~ hh]*2,~ cp").bank('RolandTR909')
```

## 5. Minimal Polyrhythmic Drums

**Prompt:** Generate a minimal drum-machine groove built from kick, snare, and closed hi-hat only. Use uneven rhythmic groupings and rotated accents to create a looping pattern that feels slightly off-balance but tight. Let the kick and snare trade density and space, with occasional bursts that break the symmetry. Keep the hi-hats steady and driving to anchor the groove. The overall feel should be dry, punchy, and hypnotic—pure rhythm with a subtle polyrhythmic twist.

```strudel
samples({
  bd: 'bd/BT0A0D0.wav',
  sn: 'sn/ST0T0S3.wav',
  hh: 'hh/000_hh3closedhh.wav'
}, 'https://loophole-letters.vercel.app/samples/tidal/')

stack(
  "<bd!3 bd(3,4,3)>".color('#F5A623'),
  "hh*4".color('#673AB7'),
  "~ <sn!3 sn(3,4,2)>".color('#4CAF50')
).s()
.pianoroll({fold:1})
```

## 6. Chiptune Platformer Theme

**Prompt:** Generate a chiptune-style platformer theme inspired by classic 8-bit game music. Write a bright, catchy lead melody with frequent rests, repeated notes, and small stepwise motions that feel playful and heroic. Add a secondary counter-melody that answers the lead in a lower register, creating call-and-response movement. Support both with a simple, driving bass line built from repeated root notes and short walking figures. Use tight note lengths and fast playback so the music feels bouncy, energetic, and loop-ready. The overall vibe should be nostalgic, joyful, and instantly memorable—perfect for an early platformer world theme.

```strudel
// Hirokazu Tanaka - World 1-1
stack(
  // melody
  note(`<
  [e5 ~] [[d5@2 c5] [~@2 e5]] ~ [~ [c5@2 d5]] [e5 e5] [d5 c5] [e5 f5] [g5 a5]
  [~ c5] [c5 d5] [e5 [c5@2 c5]] [~ c5] [f5 e5] [c5 d5] [~ g6] [g6 ~]
  [e5 ~] [[d5@2 c5] [~@2 e5]] ~ [~ [c5@2 d5]] [e5 e5] [d5 c5] [a5 g5] [c6 [e5@2 d5]]
  [~ c5] [c5 d5] [e5 [c5@2 c5]] [~ c5] [f5 e5] [c5 d5] [~ [g6@2 ~] ~@2] [g5 ~] 
  [~ a5] [b5 c6] [b5@2 ~@2 g5] ~
  [f5 ~] [[g5@2 f5] ~] [[e5 ~] [f5 ~]] [[f#5 ~] [g5 ~]]
  [~ a5] [b5 c6] [b5@2 ~@2 g5] ~
  [eb6 d6] [~ c6] ~!2
  >`)
  .clip(.95),
  // sub melody
  note(`<
  [~ g4]!2 [~ ab4]!2 [~ a4]!2 [~ bb4]!2 
  [~ a4]!2 [~ g4]!2 [d4 e4] [f4 gb4] ~!2
  [~ g4]!2 [~ ab4]!2 [~ a4]!2 [~ bb4]!2 
  [~ a4]!2 [~ g4]!2 [d4 e4] [f4 gb4] ~!2
  [~ c5]!4 [~ a4]!2 [[c4 ~] [d4 ~]] [[eb4 ~] [e4 ~]]
  [~ c5]!4 [~ eb5]!2 [g4*2 [f4 ~]] [[e4 ~] [d4 ~]]
  >`),
  // bass
  note(`<
  c3!7 a3 f3!2
  e3!2 ~!4
  c3!7 a3 f3!2
  e3!2 ~!4
  f3!2 e3!2 d3!2 ~!2
  f3!2 e3!2 ab3!2 ~!2
  >`)
  .clip(.5)
).fast(2)
```
