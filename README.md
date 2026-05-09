# Pakistan Olympiads

Pakistan Olympiads is a premium, community-run science olympiad learning platform for Pakistani students. The site now includes a content-backed public experience, imported guide material, indexed resources, extracted past-paper questions, practice tools, and an admin/moderator dashboard that is ready to connect to Supabase or another backend later.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Lucide React icons
- Local MDX-style guides in `content/guides`
- Generated resource, past-paper, and question data in `src/data`

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

Guides live in `content/guides/*.mdx` with frontmatter such as `title`, `category`, `level`, `readTime`, `sourceUrl`, and `tags`.

Downloaded and indexed resource metadata lives in:

- `src/data/resources.json`
- `src/data/past-papers.json`
- `src/data/questions.json`

The current corpus contains imported IOAA/NSTC guides, resource PDFs where Google Drive allowed direct download, external source links for restricted or oversized files, extracted past-paper questions, OCR-assisted scanned papers, and page images for diagrams/screenshots. The UI reads through `src/lib/content-data.ts`, keeping the boundary simple for a future database migration.

## Routes

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
- `/admin`
- `/admin/dashboard`

## Deployment

This app is Vercel-ready. Set environment variables from `.env.example`, then deploy with the Vercel Next.js preset.

The admin dashboard requires Supabase. Run the migration in `supabase/migrations`, configure the storage buckets and Auth redirect URLs, then run `npm run db:seed` to import the current blog, guide, resource, past-paper, and question corpus. Production verification should pass:

```bash
npm run verify
```

## Resource Ingestion

The one-time ingestion helper is `scripts/ingest_resources.py`. It expects downloaded source files in `.tmp/resource-ingest`, copies allowed public assets into `public/resources`, renders past-paper page images into `public/paper-assets`, and regenerates the JSON data files. Temporary downloads are intentionally excluded from git.
