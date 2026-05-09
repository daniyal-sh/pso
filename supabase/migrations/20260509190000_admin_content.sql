create extension if not exists pgcrypto;

do $$
begin
  create type public.admin_role_name as enum ('owner', 'editor', 'reviewer', 'contributor');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.content_kind as enum ('blog_post', 'guide', 'alumni_story', 'resource', 'past_paper', 'question', 'solution');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.content_status as enum ('draft', 'in_review', 'changes_requested', 'scheduled', 'published', 'archived');
exception
  when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.admin_role_name not null default 'contributor',
  require_mfa boolean not null default true,
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin(check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_roles
    where user_id = check_user
  );
$$;

create or replace function public.admin_role(check_user uuid default auth.uid())
returns public.admin_role_name
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.admin_roles
  where user_id = check_user;
$$;

create or replace function public.has_admin_role(allowed public.admin_role_name[], check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_roles
    where user_id = check_user
      and role = any(allowed)
  );
$$;

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  kind public.content_kind not null,
  status public.content_status not null default 'draft',
  slug text not null,
  title text not null,
  excerpt text not null default '',
  body text not null default '',
  category text not null default '',
  author_name text not null default 'Pakistan Olympiads',
  read_time text not null default '5 min',
  source_url text not null default '',
  video_url text not null default '',
  video_id text not null default '',
  video_title text not null default '',
  cover_image_url text not null default '',
  featured boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  scheduled_at timestamptz,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_items_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint content_items_publish_date check (status <> 'published' or published_at is not null),
  unique (kind, slug)
);

create index if not exists content_items_kind_status_idx on public.content_items(kind, status, published_at desc);
create index if not exists content_items_slug_idx on public.content_items(slug);
create index if not exists content_items_metadata_gin_idx on public.content_items using gin(metadata);

create table if not exists public.content_revisions (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.content_items(id) on delete cascade,
  revision_number integer not null,
  title text not null,
  excerpt text not null default '',
  body text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  status public.content_status not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (content_id, revision_number)
);

create table if not exists public.content_assets (
  id uuid primary key default gen_random_uuid(),
  content_id uuid references public.content_items(id) on delete set null,
  bucket text not null,
  object_path text not null,
  public_url text not null default '',
  mime_type text not null,
  size_bytes bigint not null default 0,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (bucket, object_path)
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  created_at timestamptz not null default now(),
  constraint tags_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table if not exists public.content_tags (
  content_id uuid not null references public.content_items(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (content_id, tag_id)
);

create table if not exists public.resources (
  id text primary key,
  status public.content_status not null default 'published',
  title text not null,
  description text not null default '',
  subject text not null,
  kind text not null,
  folder text not null default '',
  year integer,
  pages integer not null default 0,
  size_bytes bigint not null default 0,
  local_url text,
  source_url text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.past_papers (
  id text primary key,
  status public.content_status not null default 'published',
  title text not null,
  exam text not null,
  subject text not null,
  year integer not null,
  pages integer not null default 0,
  resource_url text,
  source_url text not null default '',
  scanned boolean not null default false,
  page_images text[] not null default '{}',
  question_count integer not null default 0,
  mcq_count integer not null default 0,
  descriptive_count integer not null default 0,
  part_i_count integer not null default 0,
  part_ii_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.questions (
  id text primary key,
  status public.content_status not null default 'published',
  paper_id text references public.past_papers(id) on delete set null,
  paper_subject text not null default '',
  number integer not null,
  display_number text not null default '',
  subject text not null,
  topic text not null default '',
  difficulty text not null default '',
  type text not null,
  section text not null default '',
  section_title text not null default '',
  exam text not null default '',
  year integer,
  source text not null default '',
  prompt text not null,
  options jsonb not null default '[]'::jsonb,
  answer integer,
  solution text not null default '',
  page integer,
  figure text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workflow_events (
  id uuid primary key default gen_random_uuid(),
  content_id uuid references public.content_items(id) on delete cascade,
  from_status public.content_status,
  to_status public.content_status not null,
  note text not null default '',
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_table text not null,
  entity_id text not null,
  summary text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists admin_roles_set_updated_at on public.admin_roles;
create trigger admin_roles_set_updated_at before update on public.admin_roles
for each row execute function public.set_updated_at();

drop trigger if exists content_items_set_updated_at on public.content_items;
create trigger content_items_set_updated_at before update on public.content_items
for each row execute function public.set_updated_at();

drop trigger if exists resources_set_updated_at on public.resources;
create trigger resources_set_updated_at before update on public.resources
for each row execute function public.set_updated_at();

drop trigger if exists past_papers_set_updated_at on public.past_papers;
create trigger past_papers_set_updated_at before update on public.past_papers
for each row execute function public.set_updated_at();

drop trigger if exists questions_set_updated_at on public.questions;
create trigger questions_set_updated_at before update on public.questions
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.admin_roles enable row level security;
alter table public.content_items enable row level security;
alter table public.content_revisions enable row level security;
alter table public.content_assets enable row level security;
alter table public.tags enable row level security;
alter table public.content_tags enable row level security;
alter table public.resources enable row level security;
alter table public.past_papers enable row level security;
alter table public.questions enable row level security;
alter table public.workflow_events enable row level security;
alter table public.audit_log enable row level security;

create policy "Profiles are visible to self and admins" on public.profiles
  for select using (id = auth.uid() or public.is_admin(auth.uid()));

create policy "Users can update own profile" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "Users can insert own profile" on public.profiles
  for insert with check (id = auth.uid());

create policy "Admin roles visible to self and owners" on public.admin_roles
  for select using (user_id = auth.uid() or public.has_admin_role(array['owner']::public.admin_role_name[]));

create policy "Owners manage admin roles" on public.admin_roles
  for all using (public.has_admin_role(array['owner']::public.admin_role_name[]))
  with check (public.has_admin_role(array['owner']::public.admin_role_name[]));

create policy "Bootstrap first owner" on public.admin_roles
  for insert with check (
    role = 'owner'
    and user_id = auth.uid()
    and not exists (select 1 from public.admin_roles)
  );

create policy "Published content is public" on public.content_items
  for select using (status = 'published' and published_at <= now());

create policy "Admins can read all content" on public.content_items
  for select using (public.is_admin(auth.uid()));

create policy "Contributors can create drafts" on public.content_items
  for insert with check (
    public.has_admin_role(array['owner','editor','contributor']::public.admin_role_name[])
    and created_by = auth.uid()
    and status in ('draft', 'in_review')
  );

create policy "Editors can update content" on public.content_items
  for update using (
    public.has_admin_role(array['owner','editor']::public.admin_role_name[])
    or (
      public.has_admin_role(array['contributor']::public.admin_role_name[])
      and created_by = auth.uid()
      and status in ('draft', 'changes_requested', 'in_review')
    )
  ) with check (
    public.has_admin_role(array['owner','editor']::public.admin_role_name[])
    or (
      public.has_admin_role(array['contributor']::public.admin_role_name[])
      and created_by = auth.uid()
      and status in ('draft', 'changes_requested', 'in_review')
    )
  );

create policy "Owners and editors delete content" on public.content_items
  for delete using (public.has_admin_role(array['owner','editor']::public.admin_role_name[]));

create policy "Admins read revisions" on public.content_revisions
  for select using (public.is_admin(auth.uid()));

create policy "Admins create revisions" on public.content_revisions
  for insert with check (public.has_admin_role(array['owner','editor','reviewer','contributor']::public.admin_role_name[]));

create policy "Public tags are readable" on public.tags for select using (true);
create policy "Admins manage tags" on public.tags
  for all using (public.has_admin_role(array['owner','editor']::public.admin_role_name[]))
  with check (public.has_admin_role(array['owner','editor']::public.admin_role_name[]));

create policy "Public content tags are readable" on public.content_tags for select using (true);
create policy "Admins manage content tags" on public.content_tags
  for all using (public.has_admin_role(array['owner','editor','contributor']::public.admin_role_name[]))
  with check (public.has_admin_role(array['owner','editor','contributor']::public.admin_role_name[]));

create policy "Published resources are public" on public.resources for select using (status = 'published');
create policy "Published papers are public" on public.past_papers for select using (status = 'published');
create policy "Published questions are public" on public.questions for select using (status = 'published');

create policy "Admins manage resources" on public.resources
  for all using (public.has_admin_role(array['owner','editor']::public.admin_role_name[]))
  with check (public.has_admin_role(array['owner','editor']::public.admin_role_name[]));

create policy "Admins manage papers" on public.past_papers
  for all using (public.has_admin_role(array['owner','editor']::public.admin_role_name[]))
  with check (public.has_admin_role(array['owner','editor']::public.admin_role_name[]));

create policy "Admins manage questions" on public.questions
  for all using (public.has_admin_role(array['owner','editor','contributor']::public.admin_role_name[]))
  with check (public.has_admin_role(array['owner','editor','contributor']::public.admin_role_name[]));

create policy "Admins read assets" on public.content_assets
  for select using (public.is_admin(auth.uid()));

create policy "Admins create assets" on public.content_assets
  for insert with check (public.has_admin_role(array['owner','editor','contributor']::public.admin_role_name[]));

create policy "Admins read workflow events" on public.workflow_events
  for select using (public.is_admin(auth.uid()));

create policy "Admins create workflow events" on public.workflow_events
  for insert with check (public.has_admin_role(array['owner','editor','reviewer','contributor']::public.admin_role_name[]));

create policy "Owners read audit log" on public.audit_log
  for select using (public.has_admin_role(array['owner']::public.admin_role_name[]));

create policy "Admins create audit log" on public.audit_log
  for insert with check (public.is_admin(auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('content-assets', 'content-assets', true, 10485760, array['image/png','image/jpeg','image/webp','image/gif']),
  ('resource-files', 'resource-files', true, 52428800, array['application/pdf','image/png','image/jpeg','image/webp']),
  ('paper-assets', 'paper-assets', true, 52428800, array['application/pdf','image/png','image/jpeg','image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Public reads managed storage buckets" on storage.objects
  for select using (bucket_id in ('content-assets', 'resource-files', 'paper-assets'));

create policy "Admins upload managed storage objects" on storage.objects
  for insert with check (
    public.has_admin_role(array['owner','editor','contributor']::public.admin_role_name[])
    and bucket_id in ('content-assets', 'resource-files', 'paper-assets')
  );

create policy "Owners and editors update managed storage objects" on storage.objects
  for update using (
    public.has_admin_role(array['owner','editor']::public.admin_role_name[])
    and bucket_id in ('content-assets', 'resource-files', 'paper-assets')
  ) with check (
    public.has_admin_role(array['owner','editor']::public.admin_role_name[])
    and bucket_id in ('content-assets', 'resource-files', 'paper-assets')
  );

create policy "Owners and editors delete managed storage objects" on storage.objects
  for delete using (
    public.has_admin_role(array['owner','editor']::public.admin_role_name[])
    and bucket_id in ('content-assets', 'resource-files', 'paper-assets')
  );
