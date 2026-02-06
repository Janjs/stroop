'use client'

import { createElement, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Autoplay from 'embla-carousel-autoplay'
import { Pause, Play } from 'lucide-react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'
import { cn } from '@/lib/utils'
import '@strudel/repl'

if (typeof window !== 'undefined') {
  const neutralizeStrudelTheme = () => {
    const el = document.getElementById('strudel-theme-vars')
    if (el instanceof HTMLStyleElement && el.textContent?.trim()) el.textContent = ''
  }
  neutralizeStrudelTheme()
  const obs = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'childList') {
        for (const node of m.addedNodes) {
          if (node instanceof HTMLStyleElement && node.id === 'strudel-theme-vars') {
            node.textContent = ''
            return
          }
        }
      }
      if (
        m.type === 'characterData' &&
        m.target.parentElement instanceof HTMLStyleElement &&
        m.target.parentElement.id === 'strudel-theme-vars'
      ) {
        m.target.parentElement.textContent = ''
        return
      }
    }
  })
  if (document.head) {
    obs.observe(document.head, { childList: true, subtree: true, characterData: true })
  }
  queueMicrotask(neutralizeStrudelTheme)
  requestAnimationFrame(neutralizeStrudelTheme)
}

type StrudelEditorElement = HTMLElement & {
  editor?: {
    setCode?: (code: string) => void
    evaluate?: (autostart?: boolean) => void | Promise<unknown>
    start?: () => void
    stop?: () => void
  }
}

const EXAMPLES = [
  {
    title: 'Techno Bass Fugue',
    prompt:
      'Generate a techno bass fugue built from electric bass samples in a minor scale. Create a repeating but evolving bass motif using nested rhythmic groupings and polymetric subdivisions.',
    code: `"<8(3,8) <7 7*2> [4 5@3] 8>".sub(1)
.layer(
  x=>x,
  x=>x.add(7)
  .off(1/8,x=>x.add("2,4"))
  .slow(2),
).n().scale('A1 minor')
.s("flbass").n(0)
.cutoff(sine.slow(7).range(200,4000))
.resonance(10).clip(1)
.stack(s("bd:1*2,~ sd:0,[~ hh:0]*2"))`,
    fullCode: `samples({ flbass: ['00_c2_finger_long_neck.wav','01_c2_finger_short_neck.wav','02_c2_finger_long_bridge.wav','03_c2_finger_short_bridge.wav','04_c2_pick_long.wav','05_c2_pick_short.wav','06_c2_palm_mute.wav'] }, 
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
    title: 'Blippy Rhodes Jazz-Techno',
    prompt:
      'Generate a playful, blippy Rhodes-led groove with a jazzy–electronic feel. Use a bright electric piano playing short, syncopated motifs that loop and mutate.',
    code: `stack(
  s("<bd sn> <hh hh*2 hh*3>"),
  "<g4 c5 a4 [ab4 <eb5 f5>]>"
  .scale("<C:major C:mixolydian F:lydian>")
  .struct("x*8")
  .scaleTranspose("0 [-5,-2] -7 [-9,-2]")
  .slow(2).note().clip(.3)
  .s('rhodes').room(.5)
  .delay(.3).delayfeedback(.4),
).fast(3/2)`,
    fullCode: `samples({
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
    title: 'Minimal Piano',
    prompt:
      'Generate a minimal, melodic piano pattern in a minor key with a hypnotic, generative feel. Build a short motif from simple scale degrees with subtle polyrhythms.',
    code: `n("<0 2 [4 6](3,4,2) 3*2>")
.off(1/4, x=>x.add(n(2)))
.off(1/2, x=>x.add(n(6)))
.scale('D minor')
.echo(4, 1/8, .5)
.clip(.5)
.piano()
.pianoroll()`,
    fullCode: `n("<0 2 [4 6](3,4,2) 3*2>").color('salmon')
.off(1/4, x=>x.add(n(2)).color('green'))
.off(1/2, x=>x.add(n(6)).color('steelblue'))
.scale('D minor')
.echo(4, 1/8, .5)
.clip(.5)
.piano()
.pianoroll()`,
  },
  {
    title: 'Club-Jazz Csound Groove',
    prompt:
      'Generate a live-coded jazz–electronic groove built around rich seventh chords and a steady rhythmic pulse with evolving timbral movement.',
    code: `stack(
  chord("<C^7 A7 Dm7 Fm7>/2")
  .dict('lefthand').voicing()
  .cutoff(sine.range(500,2000).slow(16))
  .euclidLegato(3,8).csound('FM1'),
  note("<C2 A1 D2 F2>/2")
  .ply(8).csound('Bass'),
  s("bd*2,[~ hh]*2,~ cp")
  .bank('RolandTR909')
)`,
    fullCode: `stack(
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
    title: 'Minimal Polyrhythmic Drums',
    prompt:
      'Generate a minimal drum-machine groove built from kick, snare, and closed hi-hat only. Use uneven rhythmic groupings and rotated accents.',
    code: `stack(
  "<bd!3 bd(3,4,3)>",
  "hh*4",
  "~ <sn!3 sn(3,4,2)>"
).s()
.pianoroll({fold:1})`,
    fullCode: `samples({
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
    title: 'Chiptune Platformer Theme',
    prompt:
      'Generate a chiptune-style platformer theme inspired by classic 8-bit game music. Write a bright, catchy lead melody that feels playful and heroic.',
    code: `stack(
  note(\`<
  [e5 ~] [[d5@2 c5] [~@2 e5]] ~
  [~ [c5@2 d5]] [e5 e5] [d5 c5]
  [e5 f5] [g5 a5]
  >\`).clip(.95),
  note(\`<
  [~ g4]!2 [~ ab4]!2
  [~ a4]!2 [~ bb4]!2
  >\`),
  note("<c3!7 a3 f3!2 e3!2>")
  .clip(.5)
).fast(2)`,
    fullCode: `stack(
  note(\`<
  [e5 ~] [[d5@2 c5] [~@2 e5]] ~ [~ [c5@2 d5]] [e5 e5] [d5 c5] [e5 f5] [g5 a5]
  [~ c5] [c5 d5] [e5 [c5@2 c5]] [~ c5] [f5 e5] [c5 d5] [~ g6] [g6 ~]
  [e5 ~] [[d5@2 c5] [~@2 e5]] ~ [~ [c5@2 d5]] [e5 e5] [d5 c5] [a5 g5] [c6 [e5@2 d5]]
  [~ c5] [c5 d5] [e5 [c5@2 c5]] [~ c5] [f5 e5] [c5 d5] [~ [g6@2 ~] ~@2] [g5 ~] 
  [~ a5] [b5 c6] [b5@2 ~@2 g5] ~
  [f5 ~] [[g5@2 f5] ~] [[e5 ~] [f5 ~]] [[f#5 ~] [g5 ~]]
  [~ a5] [b5 c6] [b5@2 ~@2 g5] ~
  [eb6 d6] [~ c6] ~!2
  >\`)
  .clip(.95),
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
  >\`)
  .clip(.5)
).fast(2)`,
  },
]

export default function ExamplesCarousel() {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [isEditorReady, setIsEditorReady] = useState(false)
  const replRef = useRef<StrudelEditorElement | null>(null)

  useEffect(() => {
    if (!api) return
    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap())
    api.on('select', () => setCurrent(api.selectedScrollSnap()))
  }, [api])

  useEffect(() => {
    let frameId = 0
    const checkReady = () => {
      if (replRef.current?.editor) {
        setIsEditorReady(true)
        return
      }
      frameId = window.requestAnimationFrame(checkReady)
    }
    frameId = window.requestAnimationFrame(checkReady)
    return () => window.cancelAnimationFrame(frameId)
  }, [])

  useEffect(() => {
    if (playingIndex !== null && playingIndex !== current) {
      replRef.current?.editor?.stop?.()
      setPlayingIndex(null)
    }
  }, [current, playingIndex])

  const scrollTo = useCallback(
    (index: number) => api?.scrollTo(index),
    [api],
  )

  const handleTogglePlay = async (index: number) => {
    const repl = replRef.current
    if (!repl?.editor) return

    if (playingIndex === index) {
      repl.editor.stop?.()
      setPlayingIndex(null)
      return
    }

    if (playingIndex !== null) {
      repl.editor.stop?.()
    }

    const example = EXAMPLES[index]
    const code = example.fullCode

    if (repl.editor.setCode) {
      repl.editor.setCode(code)
    } else {
      repl.setAttribute('code', code)
    }

    try {
      const result = repl.editor.evaluate?.()
      if (result && typeof (result as Promise<unknown>).then === 'function') {
        await result
      }
      repl.editor.start?.()
      setPlayingIndex(index)
    } catch (error) {
      console.error('Failed to start Strudel playback:', error)
    }
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="absolute w-0 h-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {createElement('strudel-editor', { ref: replRef })}
      </div>
      <div className="flex items-center gap-2 text-muted-foreground px-1">
        <Icons.music className="h-4 w-4" />
        <span className="text-sm font-medium">Examples</span>
      </div>
      <Carousel
        setApi={setApi}
        opts={{ loop: true }}
        plugins={[Autoplay({ delay: 6000, stopOnInteraction: true, stopOnMouseEnter: true })]}
        className="w-full"
      >
        <CarouselContent>
          {EXAMPLES.map((example, i) => (
            <CarouselItem key={i}>
              <Card className="border-l-2 border-l-primary/40 overflow-hidden">
                <CardHeader className="pb-2 px-5 pt-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold font-outfit">
                      {example.title}
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn(
                        'h-8 w-8 rounded-full shrink-0 transition-colors',
                        playingIndex === i && 'bg-primary text-primary-foreground hover:bg-primary/90',
                      )}
                      onClick={() => handleTogglePlay(i)}
                      disabled={!isEditorReady}
                    >
                      {playingIndex === i ? (
                        <Pause className="h-3.5 w-3.5" />
                      ) : (
                        <Play className="h-3.5 w-3.5 ml-0.5" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {example.prompt}
                  </p>
                </CardHeader>
                <CardContent className="px-5 pb-4 space-y-3">
                  <div className="relative rounded-md bg-muted/60 overflow-hidden">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border/40">
                      <span className="h-2 w-2 rounded-full bg-red-400/60" />
                      <span className="h-2 w-2 rounded-full bg-yellow-400/60" />
                      <span className="h-2 w-2 rounded-full bg-green-400/60" />
                      <span className="ml-2 text-[10px] text-muted-foreground/60 font-mono">
                        strudel
                      </span>
                    </div>
                    <pre className="p-3 text-xs leading-relaxed font-mono text-foreground/80 overflow-hidden max-h-[200px]">
                      <code>{example.code}</code>
                    </pre>
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-muted/60 to-transparent pointer-events-none" />
                  </div>
                  <Link
                    href={`/generate?prompt=${encodeURIComponent(example.prompt)}`}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5 px-2 -ml-2"
                    >
                      Try this prompt
                      <Icons.arrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="flex items-center justify-between mt-3 px-1">
          <div className="flex gap-1.5">
            {Array.from({ length: count }).map((_, i) => (
              <button
                key={i}
                onClick={() => scrollTo(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === current
                    ? 'w-6 bg-primary'
                    : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50',
                )}
              />
            ))}
          </div>
          <div className="flex gap-1">
            <CarouselPrevious className="static translate-y-0 h-7 w-7" />
            <CarouselNext className="static translate-y-0 h-7 w-7" />
          </div>
        </div>
      </Carousel>
    </div>
  )
}
