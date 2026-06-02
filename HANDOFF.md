# PSO Handoff Checklist

Use this when moving development to a new device.

## 1. Clone And Install

```bash
git clone https://github.com/daniyal-sh/pso.git
cd pso
npm install
cp .env.example .env.local
```

Fill `.env.local` with Supabase values and a strong `CONTENT_REVALIDATION_SECRET`.

## 2. Verify Locally

```bash
npm run typecheck
npm run lint
npm run build
npm run dev
```

Open `http://localhost:3000`.

## 3. Supabase

1. Run all SQL migrations in `supabase/migrations` in filename order.
2. Confirm buckets exist: `content-assets`, `resource-files`, `paper-assets`, `question-pdfs`.
3. Add an owner row to `admin_members`.
4. Configure Auth email templates so OTP emails include `{{ .Token }}`.
5. Seed content with `npm run db:seed` or generated SQL from `npm run db:seed:sql`.

## 4. Question PDFs

Regenerate crops when needed:

```bash
python scripts/extract_nstc_question_pdfs.py
```

Upload everything inside `output/pdf/nstc-question-crops/questions/` to the Supabase `question-pdfs` bucket, preserving paths.

## 5. Deployment

1. Add env vars in Vercel.
2. Deploy from GitHub.
3. Verify `/admin`, `/resources`, `/past-papers`, `/question-bank`, `/blog`, `/guides`, and `/olympiads`.
