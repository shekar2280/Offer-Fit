-- Read-only catalog checks. Run before and after the Hub migration.
-- Missing objects return false. Existing tables must have RLS enabled.
with expected(name) as (
  values ('hub_applications'), ('hub_resumes'), ('hub_events'),
         ('hub_drafts'), ('hub_checkins'), ('hub_email_updates'),
         ('hub_credentials'), ('hub_limits'), ('hub_mailbox_jobs')
)
select expected.name,
       tables.oid is not null as table_exists,
       coalesce(tables.relrowsecurity, false) as rls_enabled
from expected
left join pg_namespace schemas on schemas.nspname = 'public'
left join pg_class tables on tables.relnamespace = schemas.oid
  and tables.relname = expected.name and tables.relkind = 'r'
order by expected.name;

with expected(signature) as (
  values ('public.hub_track_event()'), ('public.hub_revision()'),
         ('public.hub_checkin()'), ('public.hub_consume_limit(text)'),
         ('public.hub_mark_sent(uuid)'), ('public.hub_resolve_email(uuid,text)'),
         ('public.hub_claim_mailboxes()'),
         ('public.hub_store_sync_batch(uuid,timestamp with time zone,jsonb,jsonb)'),
         ('public.hub_purge_own_data()')
)
select signature, to_regprocedure(signature) is not null as function_exists
from expected order by signature;

select id, public as publicly_accessible, file_size_limit, allowed_mime_types
from storage.buckets where id = 'hub-resumes';
-- Expect one bucket row, publicly_accessible=false.
