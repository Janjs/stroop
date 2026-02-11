# stroop 🎵

An AI-powered Strudel code generator that helps musicians discover fresh rhythmic and melodic ideas. Whether you're sketching a groove or live-coding a set, Stroop keeps your creativity flowing.

## ✨ Features

- **AI-Generated Strudel** — Describe the mood or style you want, and get Strudel snippets that match
- **Copy-Ready Code** — Snippets formatted for quick paste into Strudel
- **Prompt Suggestions** — Jump-start ideas with curated examples
- **Chat History** — Keep track of your sessions and iterations
- **Dark/Light Mode** — Easy on the eyes, day or night

## 🛠 Tech Stack

- [Next.js 15](https://nextjs.org/) — React framework
- [Convex](https://convex.dev/) — Backend and auth (self-hosted)
- [OpenAI](https://openai.com/) — AI generation
- [Strudel](https://strudel.cc/) — Live-coding music environment
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [Radix UI](https://www.radix-ui.com/) — Accessible components

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/Janjs/stroop.git
cd stroop

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Add your OpenAI API key to .env.local
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
pnpm build
pnpm start
```

### Convex (self-hosted)

The app uses a self-hosted Convex backend.

**Next.js app (Coolify)** — set **NEXT_PUBLIC_CONVEX_URL** to the **Convex backend** URL (e.g. `https://backend.stroop.janjs.dev`). The frontend talks to Convex at this URL. Do not set it to the Next.js app URL.

**Convex backend** — set **CONVEX_SITE_ORIGIN** to the **Next.js app** URL (e.g. `https://stroop.janjs.dev`). OAuth callbacks go here, not to the backend.

## 🔗 Demo

**[stroop.janjs.dev](https://stroop.janjs.dev)**

## 👤 Author

Made by [@Janjs](https://x.com/Janjijs)

## 📄 License

MIT
