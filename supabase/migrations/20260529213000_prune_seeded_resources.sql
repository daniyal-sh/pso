-- Originally `delete from public.resources;`, a one-time cleanup of legacy seeded rows
-- that ran before admin uploads existed. It is intentionally a no-op now so that
-- re-running migrations can never wipe resources uploaded through /admin/resources.
select 1;
