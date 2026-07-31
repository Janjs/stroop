import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'A Stroop creation was shared with you',
  description: 'Listen to a playable Strudel creation, then make your own with Stroop.',
  openGraph: {
    title: 'A Stroop creation was shared with you',
    description: 'Listen to a playable Strudel creation, then make your own with Stroop.',
    type: 'website',
    images: [{ url: './opengraph-image', width: 1200, height: 630, alt: 'A shared Stroop creation' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'A Stroop creation was shared with you',
    description: 'Listen to a playable Strudel creation, then make your own with Stroop.',
    images: ['./opengraph-image'],
  },
}

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return children
}
