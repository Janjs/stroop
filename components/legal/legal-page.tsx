import Link from 'next/link'
import { LEGAL_PAGES, type LegalSlug } from '@/lib/legal'

export function LegalPage({ slug }: { slug: LegalSlug }) {
  const page = LEGAL_PAGES[slug]

  return (
    <article className="mx-auto w-full max-w-2xl px-5 py-10 md:px-10">
      <p className="mb-4 text-xs text-muted-foreground">
        <Link href="/" className="underline-offset-4 hover:underline">
          Home
        </Link>
      </p>
      <h1 className="font-outfit text-3xl font-semibold tracking-[-0.03em]">{page.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated {page.updated}</p>
      <div className="mt-8 space-y-6">
        {page.sections.map((section) => (
          <section key={section.heading} className="space-y-2">
            <h2 className="font-outfit text-lg font-semibold tracking-[-0.02em]">{section.heading}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{section.body}</p>
          </section>
        ))}
      </div>
      <nav className="mt-10 flex gap-3 text-xs text-muted-foreground" aria-label="Legal">
        <Link href="/legal/privacy" className="underline-offset-4 hover:underline">Privacy</Link>
        <Link href="/legal/terms" className="underline-offset-4 hover:underline">Terms</Link>
        <Link href="/legal/refunds" className="underline-offset-4 hover:underline">Refunds</Link>
      </nav>
    </article>
  )
}
