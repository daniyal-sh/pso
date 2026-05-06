# Pakistan Olympiads

Pakistan Olympiads is a Next.js MVP for a premium, community-run science olympiad learning platform. It includes public content pages, guide placeholders, a question bank, past paper practice UI, and an admin dashboard ready to connect to a real backend later.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Lucide React icons
- Local MDX-style guide placeholders in `content/guides`

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Content Model

The MVP uses mock data in `src/lib/data.ts` and guide files in `content/guides/*.mdx`. Each guide includes frontmatter such as `title`, `category`, `level`, `readTime`, `sourceUrl`, and `tags`.

The data boundaries are intentionally simple so the project can later connect to Supabase, Postgres, or another backend without replacing the UI.

## Routes

- `/`
- `/olympiads`
- `/olympiads/[slug]`
- `/guides`
- `/guides/[slug]`
- `/question-bank`
- `/past-papers`
- `/blog`
- `/blog/[slug]`
- `/alumni`
- `/about`
- `/admin/dashboard`

## Deployment

This app is Vercel-ready. Set environment variables from `.env.example`, then deploy with the Vercel Next.js preset.
