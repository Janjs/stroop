import { createHash } from 'crypto'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../convex/_generated/api'

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!
if (!CONVEX_URL) {
  console.error('NEXT_PUBLIC_CONVEX_URL is not set')
  process.exit(1)
}

const convex = new ConvexHttpClient(CONVEX_URL)

function generateNormalizedCacheKey(promptText: string, model: string): string {
  const normalized = [
    {
      role: 'user',
      parts: [{ type: 'text', text: promptText }],
    },
  ]
  const keyData = JSON.stringify({ messages: normalized, model })
  return createHash('sha256').update(keyData).digest('hex')
}

function buildFakeResponse(title: string, description: string, code: string): string {
  const msgId = 'example_' + createHash('md5').update(title).digest('hex').slice(0, 16)
  const toolCallId = 'call_example_' + createHash('md5').update(code).digest('hex').slice(0, 16)
  const escapedCode = JSON.stringify(code).slice(1, -1)

  const introText = `Here's a ${title.toLowerCase()} pattern for you. Let me generate the Strudel code.`

  const events = [
    `data: {"type":"start"}`,
    `data: {"type":"start-step"}`,
    `data: {"type":"text-start","id":"${msgId}"}`,
    `data: {"type":"text-delta","id":"${msgId}","delta":${JSON.stringify(introText)}}`,
    `data: {"type":"text-end","id":"${msgId}"}`,
    `data: {"type":"tool-input-start","toolCallId":"${toolCallId}","toolName":"generateStrudelCode"}`,
    `data: {"type":"tool-input-delta","toolCallId":"${toolCallId}","inputTextDelta":${JSON.stringify(JSON.stringify({ description }))}}`,
    `data: {"type":"tool-input-available","toolCallId":"${toolCallId}","toolName":"generateStrudelCode","input":{"description":${JSON.stringify(description)}}}`,
    `data: {"type":"tool-output-available","toolCallId":"${toolCallId}","output":{"success":true,"snippets":[{"title":${JSON.stringify(title)},"code":"${escapedCode}"}],"message":"Generated 1 Strudel snippets."}}`,
    `data: {"type":"finish-step"}`,
    `data: {"type":"finish","finishReason":"tool-calls"}`,
    `data: [DONE]`,
  ]

  return events.map((e) => e + '\n').join('\n')
}

const EXAMPLES = [
  {
    prompt:
      'Generate a techno bass fugue built from electric bass samples in a minor scale. Create a repeating but evolving bass motif using nested rhythmic groupings and polymetric subdivisions.',
    title: 'Techno Bass Fugue',
    code: `samples({ flbass: ['00_c2_finger_long_neck.wav','01_c2_finger_short_neck.wav','02_c2_finger_long_bridge.wav','03_c2_finger_short_bridge.wav','04_c2_pick_long.wav','05_c2_pick_short.wav','06_c2_palm_mute.wav'] }, 
  'github:cleary/samples-flbass/main/')
samples({
bd: ['bd/BT0AADA.wav','bd/BT0AAD0.wav','bd/BT0A0DA.wav','bd/BT0A0D3.wav','bd/BT0A0D0.wav','bd/BT0A0A7.wav'],
sd: ['sd/rytm-01-classic.wav','sd/rytm-00-hard.wav'],
hh: ['hh27/000_hh27closedhh.wav','hh/000_hh3closedhh.wav'],
}, 'github:tidalcycles/dirt-samples');

setcps(1)

"<8(3,8) <7 7*2> [4 5@3] 8>".sub(1)
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
.clip(1)
.stack(s("bd:1*2,~ sd:0,[~ hh:0]*2"))
.pianoroll({vertical:1})`,
  },
  {
    prompt:
      'Generate a playful, blippy Rhodes-led groove with a jazzy–electronic feel. Use a bright electric piano playing short, syncopated motifs that loop and mutate.',
    title: 'Blippy Rhodes Jazz-Techno',
    code: `samples({
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
).fast(3/2)`,
  },
  {
    prompt:
      'Generate a minimal, melodic piano pattern in a minor key with a hypnotic, generative feel. Build a short motif from simple scale degrees with subtle polyrhythms.',
    title: 'Minimal Piano',
    code: `n("<0 2 [4 6](3,4,2) 3*2>").color('salmon')
.off(1/4, x=>x.add(n(2)).color('green'))
.off(1/2, x=>x.add(n(6)).color('steelblue'))
.scale('D minor')
.echo(4, 1/8, .5)
.clip(.5)
.piano()
.pianoroll()`,
  },
  {
    prompt:
      'Generate a live-coded jazz–electronic groove built around rich seventh chords and a steady rhythmic pulse with evolving timbral movement.',
    title: 'Club-Jazz Csound Groove',
    code: `stack(
  chord("<C^7 A7 Dm7 Fm7>/2").dict('lefthand').voicing()
  .cutoff(sine.range(500,2000).round().slow(16))
  .euclidLegato(3,8).s('sawtooth').gain(0.35)
  .lpf(1200).room(0.3)
  ,
  note("<C2 A1 D2 F2>/2").ply(8).s('sawtooth').gain("0.3 0.5 0.3 0.5")
  .cutoff(400).lpf(800)
  ,
  n("0 7 [4 3] 2".fast(2/3).off(".25 .125", add("<2 4 -3 -1>"))
  .slow(2).scale('A4 minor'))
  .clip(.25).s('triangle').gain(0.5).delay(0.2).delayfeedback(0.3)
  ,
  s("bd*2,[~ hh]*2,~ cp").bank('RolandTR909')
)`,
  },
  {
    prompt:
      'Generate a minimal drum-machine groove built from kick, snare, and closed hi-hat only. Use uneven rhythmic groupings and rotated accents.',
    title: 'Minimal Polyrhythmic Drums',
    code: `samples({
  bd: 'bd/BT0A0D0.wav',
  sn: 'sn/ST0T0S3.wav',
  hh: 'hh/000_hh3closedhh.wav'
}, 'https://loophole-letters.vercel.app/samples/tidal/')

stack(
  "<bd!3 bd(3,4,3)>".color('#F5A623'),
  "hh*4".color('#673AB7'),
  "~ <sn!3 sn(3,4,2)>".color('#4CAF50')
).s()
.pianoroll({fold:1})`,
  },
  {
    prompt:
      'Generate a chiptune-style platformer theme inspired by classic 8-bit game music. Write a bright, catchy lead melody that feels playful and heroic.',
    title: 'Chiptune Platformer Theme',
    code: `stack(
  note(\`<
  [e5 ~] [[d5@2 c5] [~@2 e5]] ~ [~ [c5@2 d5]] [e5 e5] [d5 c5] [e5 f5] [g5 a5]
  [~ c5] [c5 d5] [e5 [c5@2 c5]] [~ c5] [f5 e5] [c5 d5] [~ g6] [g6 ~]
  [e5 ~] [[d5@2 c5] [~@2 e5]] ~ [~ [c5@2 d5]] [e5 e5] [d5 c5] [a5 g5] [c6 [e5@2 d5]]
  [~ c5] [c5 d5] [e5 [c5@2 c5]] [~ c5] [f5 e5] [c5 d5] [~ [g6@2 ~] ~@2] [g5 ~] 
  [~ a5] [b5 c6] [b5@2 ~@2 g5] ~
  [f5 ~] [[g5@2 f5] ~] [[e5 ~] [f5 ~]] [[f#5 ~] [g5 ~]]
  [~ a5] [b5 c6] [b5@2 ~@2 g5] ~
  [eb6 d6] [~ c6] ~!2
  >\`).clip(.95),
  note(\`<
  [~ g4]!2 [~ ab4]!2 [~ a4]!2 [~ bb4]!2 
  [~ a4]!2 [~ g4]!2 [d4 e4] [f4 gb4] ~!2
  [~ g4]!2 [~ ab4]!2 [~ a4]!2 [~ bb4]!2 
  [~ a4]!2 [~ g4]!2 [d4 e4] [f4 gb4] ~!2
  [~ c5]!4 [~ a4]!2 [[c4 ~] [d4 ~]] [[eb4 ~] [e4 ~]]
  [~ c5]!4 [~ eb5]!2 [g4*2 [f4 ~]] [[e4 ~] [d4 ~]]
  >\`),
  note(\`<
  c3!7 a3 f3!2
  e3!2 ~!4
  c3!7 a3 f3!2
  e3!2 ~!4
  f3!2 e3!2 d3!2 ~!2
  f3!2 e3!2 ab3!2 ~!2
  >\`).clip(.5)
).fast(2)`,
  },
]

async function seed() {
  console.log(`Seeding ${EXAMPLES.length} examples into prompt cache...`)
  console.log(`Convex URL: ${CONVEX_URL}\n`)

  const headers = {
    'cache-control': 'no-cache',
    'connection': 'keep-alive',
    'content-type': 'text/event-stream',
    'x-accel-buffering': 'no',
    'x-vercel-ai-ui-message-stream': 'v1',
  }

  for (const example of EXAMPLES) {
    const cacheKey = generateNormalizedCacheKey(example.prompt, 'gpt-5.2')
    const response = buildFakeResponse(example.title, example.prompt, example.code)

    try {
      await convex.mutation(api.cache.setPromptCache, {
        cacheKey,
        response,
        headers,
      })
      console.log(`  Cached: ${example.title} (${cacheKey.slice(0, 12)}...)`)
    } catch (error) {
      console.error(`  Failed: ${example.title}`, error)
    }
  }

  console.log('\nDone. All examples seeded into prompt cache.')
}

seed()
