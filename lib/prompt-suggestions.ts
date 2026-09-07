import { applyBackground, BACKGROUNDS } from '@/lib/appearance'

export const MOODS = [
  ...BACKGROUNDS.flatMap((bg) =>
    'mood' in bg && bg.mood
      ? [{ label: bg.mood, preview: `url(${bg.image})`, background: bg.id }]
      : [],
  ),
  { label: 'Chill' },
  { label: 'Energetic' },
  { label: 'Romantic' },
] as const

export const GENRES = ['8-bit', 'Techno', 'Ambient', 'Lo-fi', 'House', 'Jungle', 'Synthwave', 'Jazz'] as const

export function applyMoodBackground(mood: string, animate = false) {
  const match = MOODS.find((option) => option.label === mood)
  applyBackground(match && 'background' in match ? match.background : 'none', { animate })
}
