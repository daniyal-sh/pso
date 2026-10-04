-- Transactional admin writes, scheduled publishing, and legacy policy cleanup.
--
-- The app authorizes every admin action in TypeScript and then calls these functions
-- with the service role. Each function performs all of its writes (row, revision,
-- workflow event, audit entry) in one transaction, so a failure never leaves partial state.

-- Legacy admin_roles is no longer consulted for access; its bootstrap policy let any
-- signed-in user insert themselves as "owner" while the table was empty.
drop policy if exists "Bootstrap first owner" on public.admin_roles;

-- Scheduled content goes live once published_at (set to scheduled_at) has passed.
drop policy if exists "Published content is public" on public.content_items;
create policy "Published content is public" on public.content_items
  for select using (
    status in ('published', 'scheduled')
    and published_at <= now()
    and deleted_at is null
  );

-- Audit entries must come from the server, not directly from signed-in members.
drop policy if exists "Admins create audit log" on public.audit_log;

create or replace function public.admin_save_content(p_item jsonb, p_actor uuid)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_id uuid := nullif(p_item->>'id', '')::uuid;
  v_status public.content_status := (p_item->>'status')::public.content_status;
  v_scheduled_at timestamptz := nullif(p_item->>'scheduled_at', '')::timestamptz;
  v_previous public.content_items%rowtype;
  v_saved public.content_items%rowtype;
  v_published_at timestamptz;
  v_revision integer;
begin
  if v_id is not null then
    select * into v_previous
    from public.content_items
    where id = v_id and deleted_at is null
    for update;
    if not found then
      raise exception 'Content item was not found.' using errcode = 'P0002';
    end if;
    if v_previous.kind <> (p_item->>'kind')::public.content_kind then
      raise exception 'Content type cannot be changed after creation.' using errcode = '22023';
    end if;
  end if;

  if v_status = 'scheduled' and v_scheduled_at is null then
    raise exception 'Scheduled content needs a publish date.' using errcode = '22023';
  end if;

  -- Keep the original publish date on edits. A scheduled item that is published early
  -- goes live now rather than at its future scheduled time.
  v_published_at := case v_status
    when 'published' then least(coalesce(v_previous.published_at, now()), now())
    when 'scheduled' then v_scheduled_at
    else v_previous.published_at
  end;

  if v_id is null then
    insert into public.content_items (
      kind, status, slug, title, excerpt, body, category, author_name, read_time,
      source_url, video_url, video_id, video_title, cover_image_url, featured, metadata,
      scheduled_at, published_at, created_by, updated_by
    ) values (
      (p_item->>'kind')::public.content_kind, v_status, p_item->>'slug', p_item->>'title',
      p_item->>'excerpt', p_item->>'body', p_item->>'category', p_item->>'author_name',
      p_item->>'read_time', coalesce(p_item->>'source_url', ''), coalesce(p_item->>'video_url', ''),
      coalesce(p_item->>'video_id', ''), coalesce(p_item->>'video_title', ''),
      coalesce(p_item->>'cover_image_url', ''), coalesce((p_item->>'featured')::boolean, false),
      coalesce(p_item->'metadata', '{}'::jsonb),
      case when v_status = 'scheduled' then v_scheduled_at end,
      v_published_at, p_actor, p_actor
    )
    returning * into v_saved;
  else
    update public.content_items
    set status = v_status,
        slug = p_item->>'slug',
        title = p_item->>'title',
        excerpt = p_item->>'excerpt',
        body = p_item->>'body',
        category = p_item->>'category',
        author_name = p_item->>'author_name',
        read_time = p_item->>'read_time',
        source_url = coalesce(p_item->>'source_url', ''),
        video_url = coalesce(p_item->>'video_url', ''),
        video_id = coalesce(p_item->>'video_id', ''),
        video_title = coalesce(p_item->>'video_title', ''),
        cover_image_url = coalesce(p_item->>'cover_image_url', ''),
        featured = coalesce((p_item->>'featured')::boolean, false),
        metadata = coalesce(p_item->'metadata', '{}'::jsonb),
        scheduled_at = case when v_status = 'scheduled' then v_scheduled_at end,
        published_at = v_published_at,
        updated_by = p_actor
    where id = v_id
    returning * into v_saved;
  end if;

  select coalesce(max(revision_number), 0) + 1 into v_revision
  from public.content_revisions
  where content_id = v_saved.id;

  insert into public.content_revisions (content_id, revision_number, title, excerpt, body, metadata, status, created_by)
  values (v_saved.id, v_revision, v_saved.title, v_saved.excerpt, v_saved.body, v_saved.metadata, v_saved.status, p_actor);

  if v_previous.id is null or v_previous.status is distinct from v_saved.status then
    insert into public.workflow_events (content_id, from_status, to_status, note, actor_id)
    values (
      v_saved.id,
      v_previous.status,
      v_saved.status,
      case when v_previous.id is null then 'Content created from admin editor.' else 'Status updated from admin editor.' end,
      p_actor
    );
  end if;

  insert into public.audit_log (actor_id, action, entity_table, entity_id, summary, metadata)
  values (
    p_actor,
    case when v_previous.id is null then 'content.create' else 'content.update' end,
    'content_items',
    v_saved.id::text,
    format('%s %s saved as %s.', v_saved.kind, v_saved.slug, v_saved.status),
    jsonb_build_object('title', v_saved.title)
  );

  return jsonb_build_object(
    'id', v_saved.id,
    'kind', v_saved.kind,
    'slug', v_saved.slug,
    'status', v_saved.status,
    'previous_slug', v_previous.slug
  );
end;
$$;

create or replace function public.admin_transition_content(p_id uuid, p_status public.content_status, p_note text, p_actor uuid)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_previous public.content_items%rowtype;
  v_saved public.content_items%rowtype;
begin
  select * into v_previous
  from public.content_items
  where id = p_id and deleted_at is null
  for update;
  if not found then
    raise exception 'Content item was not found.' using errcode = 'P0002';
  end if;

  if p_status = 'scheduled' and v_previous.scheduled_at is null then
    raise exception 'Set a publish date in the editor before scheduling.' using errcode = '22023';
  end if;

  update public.content_items
  set status = p_status,
      published_at = case p_status
        when 'published' then least(coalesce(v_previous.published_at, now()), now())
        when 'scheduled' then v_previous.scheduled_at
        else v_previous.published_at
      end,
      updated_by = p_actor
  where id = p_id
  returning * into v_saved;

  insert into public.workflow_events (content_id, from_status, to_status, note, actor_id)
  values (p_id, v_previous.status, p_status, coalesce(p_note, ''), p_actor);

  insert into public.audit_log (actor_id, action, entity_table, entity_id, summary, metadata)
  values (
    p_actor,
    'content.transition',
    'content_items',
    p_id::text,
    format('%s %s moved to %s.', v_saved.kind, v_saved.slug, p_status),
    jsonb_build_object('title', v_saved.title, 'note', coalesce(p_note, ''))
  );

  return jsonb_build_object('id', v_saved.id, 'kind', v_saved.kind, 'slug', v_saved.slug, 'status', v_saved.status);
end;
$$;

create or replace function public.admin_delete_content(p_id uuid, p_actor uuid)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_previous public.content_items%rowtype;
begin
  delete from public.content_items where id = p_id returning * into v_previous;
  if not found then
    raise exception 'Content item was not found.' using errcode = 'P0002';
  end if;

  insert into public.audit_log (actor_id, action, entity_table, entity_id, summary, metadata)
  values (p_actor, 'content.delete', 'content_items', p_id::text,
    format('%s %s deleted.', v_previous.kind, v_previous.slug),
    jsonb_build_object('title', v_previous.title));

  return jsonb_build_object('id', v_previous.id, 'kind', v_previous.kind, 'slug', v_previous.slug);
end;
$$;

create or replace function public.admin_save_resource(p_item jsonb, p_actor uuid)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_id text := p_item->>'id';
  v_existing public.resources%rowtype;
  v_saved public.resources%rowtype;
begin
  select * into v_existing from public.resources where id = v_id for update;

  if v_existing.id is not null and v_existing.deleted_at is not null then
    raise exception 'A deleted resource already uses this ID. Choose a different title.' using errcode = '23505';
  end if;

  insert into public.resources (
    id, status, title, description, subject, kind, folder, year, pages, size_bytes,
    local_url, source_url, created_by, updated_by
  ) values (
    v_id,
    (p_item->>'status')::public.content_status,
    p_item->>'title',
    coalesce(p_item->>'description', ''),
    p_item->>'subject',
    p_item->>'kind',
    coalesce(p_item->>'folder', ''),
    nullif(p_item->>'year', '')::integer,
    coalesce(nullif(p_item->>'pages', '')::integer, 0),
    coalesce(nullif(p_item->>'size_bytes', '')::bigint, 0),
    nullif(p_item->>'local_url', ''),
    '',
    p_actor,
    p_actor
  )
  on conflict (id) do update
  set status = excluded.status,
      title = excluded.title,
      description = excluded.description,
      subject = excluded.subject,
      kind = excluded.kind,
      folder = excluded.folder,
      year = excluded.year,
      pages = excluded.pages,
      size_bytes = excluded.size_bytes,
      local_url = excluded.local_url,
      updated_by = p_actor
  returning * into v_saved;

  insert into public.audit_log (actor_id, action, entity_table, entity_id, summary)
  values (p_actor, 'resource.upsert', 'resources', v_saved.id, format('%s saved as %s.', v_saved.title, v_saved.status));

  return jsonb_build_object('id', v_saved.id, 'status', v_saved.status, 'updated_at', v_saved.updated_at);
end;
$$;

create or replace function public.admin_delete_resource(p_id text, p_actor uuid)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_previous public.resources%rowtype;
begin
  delete from public.resources where id = p_id returning * into v_previous;
  if not found then
    raise exception 'Resource was not found.' using errcode = 'P0002';
  end if;

  insert into public.audit_log (actor_id, action, entity_table, entity_id, summary)
  values (p_actor, 'resource.delete', 'resources', p_id, format('%s deleted.', v_previous.title));

  return jsonb_build_object('id', v_previous.id, 'local_url', v_previous.local_url);
end;
$$;

create or replace function public.admin_save_member_access(
  p_member_id uuid,
  p_email text,
  p_display_name text,
  p_status text,
  p_is_owner boolean,
  p_permissions jsonb,
  p_actor uuid
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_existing public.admin_members%rowtype;
  v_saved public.admin_members%rowtype;
begin
  if p_member_id is null then
    if exists (select 1 from public.admin_members where email = p_email::citext) then
      raise exception 'A member with this email already exists. Edit that member instead.' using errcode = '23505';
    end if;

    insert into public.admin_members (email, display_name, status, is_owner, invited_by)
    values (p_email::citext, p_display_name, p_status, p_is_owner, p_actor)
    returning * into v_saved;
  else
    select * into v_existing from public.admin_members where id = p_member_id for update;
    if not found then
      raise exception 'Member was not found.' using errcode = 'P0002';
    end if;

    update public.admin_members
    set email = p_email::citext,
        display_name = p_display_name,
        status = p_status,
        is_owner = p_is_owner,
        -- A changed email is a different person: unlink the old Auth user so it loses access.
        user_id = case when v_existing.email = p_email::citext then v_existing.user_id end
    where id = p_member_id
    returning * into v_saved;
  end if;

  if not exists (select 1 from public.admin_members where is_owner and status = 'active') then
    raise exception 'At least one active owner is required.' using errcode = '23514';
  end if;

  delete from public.moderator_permissions where member_id = v_saved.id;

  if not v_saved.is_owner then
    insert into public.moderator_permissions (member_id, permission, subject)
    select v_saved.id, item->>'permission', nullif(item->>'subject', '')
    from jsonb_array_elements(coalesce(p_permissions, '[]'::jsonb)) as item;
  end if;

  insert into public.audit_log (actor_id, action, entity_table, entity_id, summary)
  values (p_actor, 'admin_member.upsert', 'admin_members', v_saved.id::text, format('Admin access updated for %s.', v_saved.email));

  return jsonb_build_object('id', v_saved.id, 'email', v_saved.email, 'is_owner', v_saved.is_owner);
end;
$$;

-- Only the server (service role) may call these; app code authorizes before calling.
revoke all on function public.admin_save_content(jsonb, uuid) from public, anon, authenticated;
revoke all on function public.admin_transition_content(uuid, public.content_status, text, uuid) from public, anon, authenticated;
revoke all on function public.admin_delete_content(uuid, uuid) from public, anon, authenticated;
revoke all on function public.admin_save_resource(jsonb, uuid) from public, anon, authenticated;
revoke all on function public.admin_delete_resource(text, uuid) from public, anon, authenticated;
revoke all on function public.admin_save_member_access(uuid, text, text, text, boolean, jsonb, uuid) from public, anon, authenticated;

grant execute on function public.admin_save_content(jsonb, uuid) to service_role;
grant execute on function public.admin_transition_content(uuid, public.content_status, text, uuid) to service_role;
grant execute on function public.admin_delete_content(uuid, uuid) to service_role;
grant execute on function public.admin_save_resource(jsonb, uuid) to service_role;
grant execute on function public.admin_delete_resource(text, uuid) to service_role;
grant execute on function public.admin_save_member_access(uuid, text, text, text, boolean, jsonb, uuid) to service_role;
