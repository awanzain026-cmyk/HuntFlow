# HuntFlow — AI Client Acquisition Agent

An AI agent that never stops hunting for clients — finds, scores, and manages leads automatically.

## What it does

- **Lead generation** via real Google search results
- **Lead scoring** to prioritize the best prospects
- **Outreach management** for tracking follow-ups
- **Briefing generation** — AI-written summaries per lead
- Dashboard to manage the full pipeline in one place

## Tech Stack

- Next.js + TypeScript
- Tailwind CSS, Framer Motion
- Recharts for pipeline analytics
- Serper API for real search-based lead discovery
- Optional: Gemini API (fallback AI) and Hunter API (real email lookup)

## Getting Started

```bash
git clone https://github.com/awanzain026-cmyk/HuntFlow.git
cd HuntFlow
npm install
cp .env.example .env.local
```

Add your API keys to `.env.local`:
- `SERPER_API_KEY` — required, free 2,500 searches at [serper.dev](https://serper.dev)
- `HUNTER_API_KEY` — optional, real email lookups at [hunter.io](https://hunter.io)
- `NEXT_PUBLIC_GEMINI_API_KEY` — optional fallback, free at [aistudio.google.com](https://aistudio.google.com/apikey)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Author

Built by [Muhammad Zain](https://portfolio-flax-tau-30.vercel.app/)
