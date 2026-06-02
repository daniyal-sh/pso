# Contributing

Thanks for helping build Pakistan Olympiads.

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Before shipping changes, run:

```bash
npm run typecheck
npm run lint
npm run build
```

## Code Guidelines

- Follow the existing App Router structure in `src/app`.
- Read `AGENTS.md` before editing Next.js route files.
- Keep server-side authorization in `src/lib/admin/auth.ts` and mutation logic in server actions/helpers.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client components or `NEXT_PUBLIC_` variables.
- Prefer Supabase-backed data for production behavior. Static JSON files are seed/extraction source data unless explicitly documented otherwise.
- Keep UI changes consistent with the existing admin/public design system.

## Content Guidelines

- Blogs and guides should be written and reviewed through the admin dashboard.
- Keep author names, excerpts, categories, and read times accurate.
- Avoid restoring legacy local resource PDFs; upload new resources through the dashboard.
- Credit source material and contributors clearly.
- Mark uncertain imported content for review rather than publishing it as verified.

## Data And Assets

- Past-paper and question seed data lives in `src/data/past-papers.json` and `src/data/questions.json`.
- Question PDF crops are generated into `output/pdf/nstc-question-crops/` and uploaded to Supabase Storage.
- `public/paper-assets` is retained for paper page and figure provenance.
- Generated outputs, local caches, logs, and downloaded temporary files should stay out of Git.
