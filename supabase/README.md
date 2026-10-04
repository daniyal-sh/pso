# Supabase Setup

This project uses Supabase for admin authentication, content tables, past-paper/question datasets, and public storage buckets.

## Migrations

Migrations live in `supabase/migrations` and must be applied once each, in filename order. Prefer the Supabase CLI, which records what has already run:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

If you apply SQL by hand (SQL editor), only run files newer than the last one applied. All migrations are written to be safe to re-run, and `supabase/tests/run.sh` checks that in CI, but the CLI avoids the question entirely.

1. `20260509190000_admin_content.sql`: base content schema and the legacy `admin_roles` table.
2. `20260529193000_question_pdf_storage.sql`: `question-pdfs` bucket.
3. `20260529203000_admin_member_permissions.sql`: current `admin_members` / `moderator_permissions` access model.
4. `20260529213000_prune_seeded_resources.sql`: now a no-op (it originally deleted legacy seeded resources).
5. `20260529223000_clear_resource_metadata_fields.sql`
6. `20260614103740_expand_resource_subject_permissions.sql`
7. `20261004120000_transactional_admin_writes.sql`: transactional `admin_*` functions used by the app for every admin write, scheduled publishing in the public content policy, and removal of the legacy owner-bootstrap policy.

App logic uses `admin_members`, not `admin_roles`.

### Testing migrations locally

With any Postgres 15+ server available:

```bash
PGHOST=localhost PGUSER=postgres supabase/tests/run.sh
```

The script applies every migration twice against a throwaway database (using stand-ins for the Supabase `auth`/`storage` schemas) and runs the behaviour checks in `supabase/tests/admin_functions.sql`.

## Required Buckets

These public buckets should exist after migrations:

- `content-assets`
- `resource-files`
- `paper-assets`
- `question-pdfs`

Public reads are allowed. Writes go through server code using `SUPABASE_SERVICE_ROLE_KEY` after app-side authorization checks. Resource files are uploaded by the browser directly to `resource-files` using a one-time signed upload URL issued by `/api/admin/resources/upload`, so the bucket's own size and MIME limits apply.

## Auth Configuration

Enable email Auth in Supabase.

For passwordless admin login, the email template used for OTP login must include:

```txt
{{ .Token }}
```

The admin UI accepts 6 to 8 digit numeric codes. If the email only contains a confirmation URL, update the Supabase email template so it sends the token as visible text too.

**Disable public sign-ups** (Authentication -> Sign In / Providers -> "Allow new users to sign up" off). The app creates Auth users for whitelisted members itself, so open sign-up is never needed, and keeping it off means nobody can pre-register a whitelisted address.

Before requesting an OTP, the app creates active whitelisted members in Supabase Auth as email-confirmed users. It then calls `signInWithOtp` with `shouldCreateUser: false`, so first login does not use the Confirm signup template or require a confirmation-link redirect.

Set Site URL and redirect URLs for local and production:

```txt
http://localhost:3000
http://localhost:3000/admin
https://pakistanolympiads.com
https://pakistanolympiads.com/admin
```

## Owner Whitelist

Before deploying app code to production, make sure at least one active owner exists:

```sql
insert into public.admin_members (email, display_name, status, is_owner)
values ('your-email@example.com', 'Owner', 'active', true)
on conflict (email) do update
set
  display_name = excluded.display_name,
  status = 'active',
  is_owner = true,
  updated_at = now();
```

Moderators can then be managed from `/admin/contributors`.

## Permission Model

- Owners can manage everything.
- Blog moderators can create, edit, publish, unpublish, and archive their own blog posts.
- Guide moderators can do the same for their own guides.
- Resource moderators can create, edit, publish, and archive resources for assigned subjects.
- Hard delete is owner-only.

Access tables:

- `admin_members`
- `moderator_permissions`

Legacy `admin_roles` exists only for migration compatibility.

## Seeding

API-based seed:

```bash
npm run db:seed
```

SQL seed generation:

```bash
npm run db:seed:sql
```

Then run generated seed files in `supabase/seeds/` in order:

1. `001_content.sql`
2. `002_past_papers.sql`
3. `003_questions_001.sql` through `003_questions_008.sql`

The seed files are idempotent.

## Question PDF Uploads

The question bank expects individual extracted PDFs in the public `question-pdfs` bucket.

Generate them locally:

```bash
python scripts/extract_nstc_question_pdfs.py
```

Upload the contents of:

```txt
output/pdf/nstc-question-crops/questions/
```

to the `question-pdfs` bucket while preserving paths. Objects should look like:

```txt
questions/2022/biology/biology-2022-final-biology-2022-068e355/biology-2022-final-biology-2022-068e355-part-i-1.pdf
```

The app serves those through:

```txt
/api/question-pdf/questions/...
```

The generated PDFs are intentionally ignored by Git.

## Resources

Resources are currently empty by design. New resources should be added from `/admin/resources`; files are uploaded to the `resource-files` bucket and saved in the `resources` table.

Do not restore legacy `public/resources` PDFs as a production source.

## Environment Variables

Required locally and on Vercel:

```txt
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
CONTENT_REVALIDATION_SECRET
```

Public pages read published rows with the anon key, so row-level security decides what is visible. The service role key is only used for admin pages and admin writes. Never expose `SUPABASE_SERVICE_ROLE_KEY` to browser code.
