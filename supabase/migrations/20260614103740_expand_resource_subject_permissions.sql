alter table public.moderator_permissions
  drop constraint if exists moderator_permissions_subject_check;

alter table public.moderator_permissions
  add constraint moderator_permissions_subject_check check (
    (permission = 'resources_subject' and subject in (
      'Astronomy',
      'Artificial Intelligence',
      'Biology',
      'Chemistry',
      'Informatics',
      'Mathematics',
      'Nuclear Science',
      'Physics'
    ))
    or (permission in ('blog', 'guide') and subject is null)
  );
