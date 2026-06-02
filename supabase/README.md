# Supabase Setup

This project uses Supabase for admin authentication, content tables, past-paper/question datasets, and public storage buckets.

## Migration Order

Run every migration in `supabase/migrations` in filename order:

1. `20260509190000_admin_content.sql`
2. `20260529193000_question_pdf_storage.sql`
3. `20260529203000_admin_member_permissions.sql`
4. `20260529213000_prune_seeded_resources.sql`
5. `20260529223000_clear_resource_metadata_fields.sql`
6. Any later cleanup migration files

The first migration creates the original content schema and legacy `admin_roles` compatibility table. The later permission migration creates the current `admin_members` and `moderator_permissions` access model. App logic should use `admin_members`, not `admin_roles`.

## Required Buckets

These public buckets should exist after migrations:

- `content-assets`
- `resource-files`
- `paper-assets`
- `question-pdfs`

Public reads are allowed. Writes should go through server actions using `SUPABASE_SERVICE_ROLE_KEY` after app-side authorization checks.

## Auth Configuration

Enable email Auth in Supabase.

For passwordless admin login, the email template used for OTP login must include:

```txt
{{ .Token }}
```

The admin UI accepts 6 to 8 digit numeric codes. If the email only contains a confirmation URL, update the Supabase email template so it sends the token as visible text too.

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

Never expose `SUPABASE_SERVICE_ROLE_KEY` to browser code.
