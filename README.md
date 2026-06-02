# Pakistan Olympiads

Pakistan Olympiads is a Next.js platform for NSTC and science olympiad preparation in Pakistan. The public site serves blogs, guides, resources, past papers, and individual question practice from Supabase-backed data. The admin dashboard uses passwordless Supabase Auth and granular moderator permissions.

## Current Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- Supabase Auth, Postgres, and Storage
- Vercel deployment

Read `AGENTS.md` before editing Next.js route code. This repo uses Next.js 16 conventions, including Promise-shaped `params` and `searchParams` in App Router pages.

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

The app can build without Supabase credentials, but database-backed public datasets and admin writes need the environment variables below.

## Environment Variables

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CONTENT_REVALIDATION_SECRET=
```

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` come from Supabase Project Settings -> API.
- `SUPABASE_SERVICE_ROLE_KEY` is the private service role key. Never expose it in client code.
- `CONTENT_REVALIDATION_SECRET` is any strong random string used by `/api/revalidate`.
- In Vercel, set production `NEXT_PUBLIC_APP_URL` to `https://pakistanolympiads.com`.

## Core Routes

Public:

- `/`
- `/olympiads`
- `/olympiads/[slug]`
- `/guides`
- `/guides/[slug]`
- `/resources`
- `/question-bank`
- `/past-papers`
- `/past-papers/[paperId]`
- `/blog`
- `/blog/[slug]`
- `/alumni`
- `/about`

Admin:

- `/admin`
- `/admin/dashboard`
- `/admin/posts`
- `/admin/guides`
- `/admin/resources`
- `/admin/contributors`
- `/admin/analytics`
- `/admin/settings`

## Supabase

Run the migrations in `supabase/migrations` in filename order, then seed content with either:

```bash
npm run db:seed
```

or generate SQL seed files:

```bash
npm run db:seed:sql
```

See `supabase/README.md` for the full production setup, owner whitelist SQL, Auth OTP template notes, storage buckets, and question PDF upload steps.

## Content And Data

- Blogs, guides, alumni stories, and admin-managed resources are stored in `content_items` or `resources`.
- Past papers and questions are stored in `past_papers` and `questions`.
- `src/data/past-papers.json` and `src/data/questions.json` are retained as seed and extraction source data, not as the production runtime source.
- Individual question PDFs are generated locally into `output/pdf/nstc-question-crops/questions/` and uploaded to the Supabase `question-pdfs` bucket.
- `public/paper-assets` is kept for paper page/figure provenance while storage coverage is verified.

## Useful Scripts

```bash
npm run dev
npm run typecheck
npm run lint
npm run build
npm run verify
npm run db:seed
npm run db:seed:sql
```

NSTC extraction and validation helpers live in `scripts/`, especially:

- `scripts/extract_nstc_question_pdfs.py`
- `scripts/audit_nstc_papers.py`
- `scripts/validate_question_bank.py`

`scripts/ingest_resources.py` is legacy import tooling from the old local-resource phase. New resources should be uploaded through the admin dashboard into Supabase Storage.

## Handoff Checklist

1. Clone the repo and run `npm install`.
2. Copy `.env.example` to `.env.local` and fill Supabase/Vercel values.
3. Run `npm run typecheck`, `npm run lint`, and `npm run build`.
4. Confirm Supabase migrations are applied in order.
5. Confirm an owner row exists in `admin_members`.
6. Confirm Supabase Auth email templates send an OTP token.
7. Upload regenerated question PDFs from `output/pdf/nstc-question-crops/questions/` to `question-pdfs`.
8. Deploy to Vercel after local verification passes.
