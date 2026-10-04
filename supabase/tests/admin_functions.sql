-- Behaviour checks for the admin write functions and public policies.
-- Every check raises on failure, so psql -v ON_ERROR_STOP=1 exits non-zero.

\set ON_ERROR_STOP 1
grant select on all tables in schema public to anon, authenticated;
grant all on all tables in schema public to service_role;
insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000a','owner@x.com'), ('00000000-0000-0000-0000-00000000000b','mod@x.com');
insert into admin_members (email, user_id, display_name, is_owner) values ('owner@x.com','00000000-0000-0000-0000-00000000000a','Owner',true);

-- create published post, then edit it: published_at must be preserved
select admin_save_content('{"kind":"blog_post","status":"published","slug":"hello","title":"Hello","excerpt":"e","body":"b","category":"c","author_name":"a","read_time":"1 min","video_id":"dQw4w9WgXcQ","metadata":{"tags":["x"]}}', '00000000-0000-0000-0000-00000000000a') as r \gset
update content_items set published_at = '2025-01-01' where slug='hello';
select admin_save_content(jsonb_build_object('id', (:'r'::jsonb)->>'id', 'kind','blog_post','status','published','slug','hello','title','Hello 2','excerpt','e','body','b2','category','c','author_name','a','read_time','1 min','video_id','dQw4w9WgXcQ'), '00000000-0000-0000-0000-00000000000a');
do $$ begin if not (select published_at = '2025-01-01'::timestamptz from content_items where slug='hello') then raise exception 'FAILED: preserved_published_at'; end if; raise notice 'PASS preserved_published_at'; end $$;
do $$ begin if not (select count(*) = 2 from content_revisions) then raise exception 'FAILED: revisions'; end if; raise notice 'PASS revisions'; end $$;
do $$ begin if not (select count(*) = 1 from workflow_events) then raise exception 'FAILED: workflow_only_on_status_change'; end if; raise notice 'PASS workflow_only_on_status_change'; end $$;
do $$ begin if not (select count(*) = 2 from audit_log) then raise exception 'FAILED: audit'; end if; raise notice 'PASS audit'; end $$;

-- kind change rejected, and nothing written
do $$ begin
  perform admin_save_content(jsonb_build_object('id',(select id from content_items where slug='hello'),'kind','guide','status','draft','slug','hello','title','x','excerpt','e','body','b','category','c','author_name','a','read_time','1'), null);
  raise exception 'kind change should fail';
exception when sqlstate '22023' then raise notice 'PASS kind change rejected';
end $$;

-- scheduled: future hidden from anon, past visible
select admin_save_content('{"kind":"blog_post","status":"scheduled","slug":"future","title":"F","excerpt":"e","body":"b","category":"c","author_name":"a","read_time":"1","scheduled_at":"2099-01-01T00:00:00Z"}', null);
select admin_save_content('{"kind":"blog_post","status":"scheduled","slug":"past","title":"P","excerpt":"e","body":"b","category":"c","author_name":"a","read_time":"1","scheduled_at":"2020-01-01T00:00:00Z"}', null);
set role anon;
do $$ begin if not (select string_agg(slug, ',' order by slug) = 'hello,past' from content_items) then raise exception 'FAILED: anon_sees_live_only'; end if; raise notice 'PASS anon_sees_live_only'; end $$;
reset role;

-- publishing a future-scheduled item early goes live now
select admin_transition_content((select id from content_items where slug='future'), 'published', 'early', null);
do $$ begin if not (select published_at <= now() from content_items where slug='future') then raise exception 'FAILED: early_publish_now'; end if; raise notice 'PASS early_publish_now'; end $$;

-- anon/authenticated cannot call admin functions
set role authenticated;
do $$ begin perform admin_delete_content(gen_random_uuid(), null); raise exception 'should be denied';
exception when insufficient_privilege then raise notice 'PASS authenticated cannot execute admin functions'; end $$;
reset role;

-- member access: create, duplicate rejected, email change unlinks user, last-owner guard
select admin_save_member_access(null, 'mod@x.com', 'Mod', 'active', false, '[{"permission":"blog"},{"permission":"resources_subject","subject":"Physics"}]', null) as m \gset
update admin_members set user_id='00000000-0000-0000-0000-00000000000b' where email='mod@x.com';
do $$ begin perform admin_save_member_access(null, 'MOD@x.com', 'Dup', 'active', true, '[]', null); raise exception 'dup should fail';
exception when unique_violation then raise notice 'PASS duplicate member rejected (case-insensitive)'; end $$;
do $$ begin if not (select count(*) = 2 from moderator_permissions) then raise exception 'FAILED: perms'; end if; raise notice 'PASS perms'; end $$;
select admin_save_member_access(((:'m')::jsonb->>'id')::uuid, 'new@x.com', 'Mod', 'active', false, '[{"permission":"guide"}]', null);
do $$ begin if not (select user_id is null from admin_members where email='new@x.com') then raise exception 'FAILED: email_change_unlinks'; end if; raise notice 'PASS email_change_unlinks'; end $$;
do $$ begin if not (select string_agg(permission, ',') = 'guide' from moderator_permissions) then raise exception 'FAILED: perms_replaced'; end if; raise notice 'PASS perms_replaced'; end $$;
do $$ begin perform admin_save_member_access((select id from admin_members where email='owner@x.com'), 'owner@x.com', 'Owner', 'disabled', true, '[]', null); raise exception 'last owner should fail';
exception when check_violation then raise notice 'PASS last active owner protected'; end $$;
do $$ begin if not (select status = 'active' from admin_members where email='owner@x.com') then raise exception 'FAILED: owner_still_active'; end if; raise notice 'PASS owner_still_active'; end $$;

-- bad permission rolls back the whole save (member untouched)
do $$ begin perform admin_save_member_access((select id from admin_members where email='new@x.com'), 'new@x.com', 'Renamed', 'active', false, '[{"permission":"resources_subject","subject":"Cooking"}]', null);
exception when check_violation then raise notice 'PASS invalid permission rejected'; end $$;
do $$ begin if not (select display_name = 'Mod' from admin_members where email='new@x.com') then raise exception 'FAILED: atomic_rollback'; end if; raise notice 'PASS atomic_rollback'; end $$;

-- resources
select admin_save_resource('{"id":"physics-notes","status":"published","title":"Notes","subject":"Physics","kind":"Book","local_url":"/resources/physics/a.pdf","size_bytes":"10"}', null);
select admin_save_resource('{"id":"physics-notes","status":"draft","title":"Notes v2","subject":"Physics","kind":"Book","local_url":"/resources/physics/a.pdf"}', null);
do $$ begin if not (select title = 'Notes v2' and status='draft' from resources) then raise exception 'FAILED: resource_upsert'; end if; raise notice 'PASS resource_upsert'; end $$;
do $$ begin if not ((admin_delete_resource('physics-notes', null))->>'local_url' = '/resources/physics/a.pdf') then raise exception 'FAILED: resource_delete'; end if; raise notice 'PASS resource_delete'; end $$;
do $$ begin if not (not exists (select 1 from pg_policies where policyname='Bootstrap first owner')) then raise exception 'FAILED: bootstrap_policy_gone'; end if; raise notice 'PASS bootstrap_policy_gone'; end $$;
