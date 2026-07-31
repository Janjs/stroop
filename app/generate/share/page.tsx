import type { Metadata } from 'next'
import SharedStroopPage from './shared-stroop'

type SharePageProps = {
  searchParams: Promise<{ chatId?: string; title?: string }>
}

const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL || 'https://stroop.janjs.dev'

export async function generateMetadata({ searchParams }: SharePageProps): Promise<Metadata> {
  const { chatId, title = 'Shared Stroop' } = await searchParams
  const description = 'Listen to a playable Strudel creation, then make your own with Stroop.'
  const image = new URL('/api/share-image', siteOrigin)
  image.searchParams.set('title', title)
  const url = new URL('/generate/share', siteOrigin)
  if (chatId) url.searchParams.set('chatId', chatId)
  url.searchParams.set('title', title)

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

export default function SharePage() {
  return <SharedStroopPage />
}
