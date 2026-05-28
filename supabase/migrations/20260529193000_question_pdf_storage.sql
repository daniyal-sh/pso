insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('question-pdfs', 'question-pdfs', true, 10485760, array['application/pdf'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public reads question PDF bucket'
  ) then
    create policy "Public reads question PDF bucket" on storage.objects
      for select using (bucket_id = 'question-pdfs');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Admins upload question PDFs'
  ) then
    create policy "Admins upload question PDFs" on storage.objects
      for insert with check (
        public.has_admin_role(array['owner','editor','contributor']::public.admin_role_name[])
        and bucket_id = 'question-pdfs'
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Owners and editors update question PDFs'
  ) then
    create policy "Owners and editors update question PDFs" on storage.objects
      for update using (
        public.has_admin_role(array['owner','editor']::public.admin_role_name[])
        and bucket_id = 'question-pdfs'
      ) with check (
        public.has_admin_role(array['owner','editor']::public.admin_role_name[])
        and bucket_id = 'question-pdfs'
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Owners and editors delete question PDFs'
  ) then
    create policy "Owners and editors delete question PDFs" on storage.objects
      for delete using (
        public.has_admin_role(array['owner','editor']::public.admin_role_name[])
        and bucket_id = 'question-pdfs'
      );
  end if;
end $$;
