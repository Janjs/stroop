import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

const LINKS = [
  { href: '/legal/privacy', label: 'Privacy' },
  { href: '/legal/terms', label: 'Terms' },
  { href: '/legal/refunds', label: 'Refunds' },
] as const

function LegalLinks() {
  return LINKS.map((link) => (
    <Link key={link.href} href={link.href} className="underline-offset-4 hover:underline">
      {link.label}
    </Link>
  ))
}

export default function Footer() {
  return (
    <>
      <nav
        className="mt-auto flex items-center gap-3 px-5 pb-24 pt-6 text-xs text-muted-foreground md:hidden"
        aria-label="Legal"
      >
        <LegalLinks />
      </nav>
      <div className="fixed bottom-5 right-5 z-10 flex items-center gap-3 text-xs text-muted-foreground lg:right-16">
        <nav className="hidden items-center gap-3 md:flex" aria-label="Legal">
          <LegalLinks />
        </nav>
        <a
          href="https://janjs.dev/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-4 hover:underline"
        >
          <span className="hidden md:inline">Made by janjs</span>
          <Badge
            variant="outline"
            className="border-white/40 bg-card/70 px-3 shadow-sm backdrop-blur-xl dark:border-white/10 md:hidden"
          >
            Made by janjs
          </Badge>
        </a>
      </div>
    </>
  )
}
