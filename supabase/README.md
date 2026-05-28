# Supabase Admin Setup

This project expects Supabase for the secure admin dashboard.

## Required Steps

1. Create a Supabase project.
2. Run `supabase/migrations/20260509190000_admin_content.sql` in the Supabase SQL editor or through the Supabase CLI.
3. Confirm these public storage buckets exist: `content-assets`, `resource-files`, and `paper-assets`.
4. Configure Supabase Auth redirect URLs for local development and production:
   - `http://localhost:3000/admin`
   - `https://pakistanolympiads.com/admin`
5. Add Vercel environment variables from `.env.example`.
6. Seed current repository content. The API-based option is:

```bash
npm run db:seed
```

The seed command needs `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

If you prefer to seed through the Supabase SQL Editor instead, generate SQL files locally:

```bash
npm run db:seed:sql
```

Then run the generated files in `supabase/seeds/` in filename order:

1. `001_content.sql`
2. `002_resources.sql`
3. `003_past_papers.sql`
4. `004_questions_001.sql` through `004_questions_008.sql`

These SQL files are idempotent: re-running them updates existing seeded rows instead of creating duplicates.

## Security Notes

- RLS allows public reads only for published content.
- Admin writes are restricted by `admin_roles`.
- The app still re-checks roles inside Server Actions because UI and proxy checks are not sufficient.
- Every save creates a content revision and writes an audit entry.
