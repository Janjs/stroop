import { Badge } from '@/components/ui/badge'

export default function Footer() {
  return (
    <a
      href="https://janjs.dev/"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-10 md:right-10 lg:right-16"
    >
      <span className="hidden text-xs text-muted-foreground underline-offset-4 hover:underline md:inline">
        Made by janjs
      </span>
      <Badge
        variant="outline"
        className="border-white/40 bg-card/70 px-3 shadow-sm backdrop-blur-xl dark:border-white/10 md:hidden"
      >
        Made by janjs
      </Badge>
    </a>
  )
}
