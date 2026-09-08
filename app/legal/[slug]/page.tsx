import { notFound } from 'next/navigation'
import { LegalPage } from '@/components/legal/legal-page'
import { LEGAL_PAGES, type LegalSlug } from '@/lib/legal'

const SLUGS = Object.keys(LEGAL_PAGES) as LegalSlug[]

export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = LEGAL_PAGES[slug as LegalSlug]
  return { title: page ? `${page.title} · stroop` : 'stroop' }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!SLUGS.includes(slug as LegalSlug)) notFound()
  return <LegalPage slug={slug as LegalSlug} />
}
