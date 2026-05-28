update public.resources
set
  folder = '',
  year = null,
  pages = 0,
  updated_at = now()
where
  coalesce(folder, '') <> ''
  or year is not null
  or coalesce(pages, 0) <> 0;
