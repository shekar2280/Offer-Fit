-- Additive migration. Apply in a staging project first. Never run the legacy setup script over production.
begin;

create table public.hub_resumes (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(name) between 1 and 160), content text not null check (length(content) between 1 and 60000),
  file_path text, parent_id uuid, created_at timestamptz not null default now(),
  unique (id, user_id), foreign key (parent_id, user_id) references public.hub_resumes(id, user_id)
);
create table public.hub_applications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  company text not null check (length(company) between 1 and 160), role text not null check (length(role) between 1 and 200),
  job_url text not null default '' check(length(job_url) <= 2048), normalized_url text not null default '' check(length(normalized_url) <= 2048),
  jd text not null default '' check(length(jd) <= 30000), location text not null default '' check(length(location) <= 200),
  status text not null default 'saved' check(status in ('saved','preparing','applied','acknowledged','assessment','interview','offer','accepted','rejected','withdrawn','closed')),
  notes text not null default '' check(length(notes) <= 10000), resume_id uuid,
  applied_at timestamptz, last_contact_at timestamptz, next_action_at timestamptz,
  revision integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(id, user_id), foreign key(resume_id, user_id) references public.hub_resumes(id, user_id)
);
create unique index hub_application_url_unique on public.hub_applications(user_id, normalized_url) where normalized_url <> '';
create index hub_application_user_updated on public.hub_applications(user_id, updated_at desc);
create table public.hub_events (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid not null, old_status text, new_status text not null, created_at timestamptz not null default now(),
  foreign key(application_id,user_id) references public.hub_applications(id,user_id) on delete cascade
);
create table public.hub_drafts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid not null, subject text not null check(length(subject) between 1 and 300),
  body text not null check(length(body) between 1 and 12000), sent_at timestamptz, created_at timestamptz not null default now(),
  foreign key(application_id,user_id) references public.hub_applications(id,user_id) on delete cascade
);
create table public.hub_checkins (
  user_id uuid not null references auth.users(id) on delete cascade, local_date date not null,
  created_at timestamptz not null default now(), primary key(user_id, local_date)
);
create table public.hub_email_updates (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid, message_id text not null check(length(message_id) <= 100), mailbox text not null, subject text not null,
  proposed_status text check(proposed_status in ('acknowledged','assessment','interview','offer','rejected')),
  evidence text not null, received_at timestamptz not null, resolution text not null default 'pending' check(resolution in ('pending','applied','dismissed')),
  unique(user_id,mailbox,message_id), foreign key(application_id,user_id) references public.hub_applications(id,user_id) on delete cascade
);
create table public.hub_credentials (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check(kind in ('gemini','gmail')), secret text not null, metadata jsonb not null default '{}',
  updated_at timestamptz not null default now(), primary key(user_id,kind)
);
-- No browser policies. Only explicitly user-scoped server service-role access.
alter table public.hub_credentials enable row level security;
revoke all on public.hub_credentials from anon, authenticated;
grant all on public.hub_credentials to service_role;

do $$ declare tbl text; begin
  foreach tbl in array array['hub_resumes','hub_applications','hub_drafts','hub_email_updates'] loop
    execute format('alter table public.%I enable row level security',tbl);
    execute format('create policy owner_select on public.%I for select to authenticated using (auth.uid() = user_id)',tbl);
    execute format('create policy owner_insert on public.%I for insert to authenticated with check (auth.uid() = user_id)',tbl);
    execute format('create policy owner_update on public.%I for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)',tbl);
    grant usage on schema public to authenticated;
    execute format('grant select, insert, update on public.%I to authenticated',tbl);
    execute format('revoke all on public.%I from anon',tbl);
    execute format('grant all on public.%I to service_role',tbl);
  end loop;
end $$;
-- Resume versions are immutable. New versions are new records, preserving submitted artifacts.
revoke update on public.hub_resumes from authenticated;
-- Mailbox evidence can only be inserted by the authenticated server sync transaction.
revoke insert,update on public.hub_email_updates from authenticated;
alter table public.hub_events enable row level security;
create policy events_owner on public.hub_events for select to authenticated using(auth.uid() = user_id);
grant select on public.hub_events to authenticated;
revoke insert, update, delete on public.hub_events from authenticated, anon;
alter table public.hub_checkins enable row level security;
create policy checkins_owner on public.hub_checkins for select to authenticated using(auth.uid() = user_id);
grant select on public.hub_checkins to authenticated;
revoke insert, update, delete on public.hub_checkins from authenticated, anon;

create function public.hub_track_event() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if TG_OP = 'UPDATE' then
    if new.user_id <> old.user_id or new.id <> old.id then raise exception 'Ownership cannot change'; end if;
    new.revision := old.revision + 1; new.updated_at := now();
  end if;
  if TG_OP = 'INSERT' or new.status is distinct from old.status then
    insert into public.hub_events(user_id,application_id,old_status,new_status)
    values(new.user_id,new.id,case when TG_OP = 'UPDATE' then old.status else null end,new.status);
  end if;
  return new;
end $$;
-- After trigger for events ensures the parent exists; before trigger controls revision.
create function public.hub_revision() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.user_id <> old.user_id or new.id <> old.id then raise exception 'Ownership cannot change'; end if;
  new.revision := old.revision + 1; new.updated_at := now(); return new;
end $$;
create trigger hub_revision before update on public.hub_applications for each row execute function public.hub_revision();
create trigger hub_events after insert or update on public.hub_applications for each row execute function public.hub_track_event();
revoke all on function public.hub_track_event(), public.hub_revision() from public;

create function public.hub_checkin() returns date language plpgsql security definer set search_path = '' as $$
declare d date := (now() at time zone 'Asia/Kolkata')::date;
begin
  if auth.uid() is null then raise exception 'Unauthorized'; end if;
  insert into public.hub_checkins(user_id,local_date) values(auth.uid(), d) on conflict do nothing;
  return d;
end $$;
revoke all on function public.hub_checkin() from public;
grant execute on function public.hub_checkin() to authenticated;

create table public.hub_limits (
  user_id uuid not null references auth.users(id) on delete cascade, bucket text not null,
  window_start timestamptz not null, count integer not null, primary key(user_id,bucket,window_start)
);
create index hub_limits_retention on public.hub_limits(window_start);
alter table public.hub_limits enable row level security;
revoke all on public.hub_limits from anon, authenticated;
grant all on public.hub_limits to service_role;
create function public.hub_consume_limit(p_bucket text) returns boolean language plpgsql security definer set search_path = '' as $$
declare ceiling integer; current_count integer; limit_window timestamptz := date_trunc('hour',now());
begin
  if auth.uid() is null then raise exception 'Unauthorized'; end if;
  ceiling := case p_bucket when 'ai' then 20 when 'gmail' then 12 when 'upload' then 20 when 'capture' then 30 when 'write' then 120 else 0 end;
  if ceiling = 0 then return false; end if;
  insert into public.hub_limits(user_id,bucket,window_start,count) values(auth.uid(),p_bucket,limit_window,1)
  on conflict(user_id,bucket,window_start) do update set count = public.hub_limits.count + 1
  where public.hub_limits.count < ceiling returning count into current_count;
  return current_count is not null;
end $$;
revoke all on function public.hub_consume_limit(text) from public;
grant execute on function public.hub_consume_limit(text) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('hub-resumes','hub-resumes',false,5242880,array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain','application/x-tex'])
on conflict(id) do nothing;
create policy hub_resume_storage_read on storage.objects for select to authenticated
using(bucket_id = 'hub-resumes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy hub_resume_storage_insert on storage.objects for insert to authenticated
with check(bucket_id = 'hub-resumes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy hub_resume_storage_delete on storage.objects for delete to authenticated
using(bucket_id = 'hub-resumes' and (storage.foldername(name))[1] = auth.uid()::text);

create function public.hub_mark_sent(p_id uuid) returns boolean language plpgsql security definer set search_path = '' as $$
declare draft public.hub_drafts; sent timestamptz := now();
begin
  if auth.uid() is null then raise exception 'Unauthorized'; end if;
  select * into draft from public.hub_drafts where id = p_id and user_id = auth.uid() for update;
  if not found then return false; end if;
  if draft.sent_at is not null then return true; end if;
  update public.hub_drafts set sent_at = sent where id = p_id and user_id = auth.uid();
  update public.hub_applications set last_contact_at = greatest(coalesce(last_contact_at,sent),sent)
  where id = draft.application_id and user_id = auth.uid();
  return true;
end $$;
create function public.hub_resolve_email(p_id uuid,p_resolution text) returns boolean language plpgsql security definer set search_path = '' as $$
declare email public.hub_email_updates; application public.hub_applications;
begin
  if auth.uid() is null then raise exception 'Unauthorized'; end if;
  if p_resolution not in ('applied','dismissed') then raise exception 'Invalid resolution'; end if;
  select * into email from public.hub_email_updates where id = p_id and user_id = auth.uid() and resolution = 'pending' for update;
  if not found then return false; end if;
  if p_resolution = 'applied' then
    if email.application_id is null or email.proposed_status is null then return false; end if;
    select * into application from public.hub_applications where id = email.application_id and user_id = auth.uid() for update;
    if not found or application.status in ('accepted','rejected','withdrawn','closed') or application.updated_at > email.received_at then return false; end if;
    if email.proposed_status = 'acknowledged' and application.status in ('assessment','interview','offer') then return false; end if;
    if email.proposed_status = 'assessment' and application.status in ('interview','offer') then return false; end if;
    if email.proposed_status = 'interview' and application.status = 'offer' then return false; end if;
    update public.hub_applications set status = email.proposed_status,
      last_contact_at = case when email.proposed_status = 'acknowledged' then last_contact_at else greatest(coalesce(last_contact_at,email.received_at),email.received_at) end
    where id = email.application_id and user_id = auth.uid();
  end if;
  update public.hub_email_updates set resolution = p_resolution where id = p_id and user_id = auth.uid();
  return true;
end $$;
revoke all on function public.hub_mark_sent(uuid), public.hub_resolve_email(uuid,text) from public;
grant execute on function public.hub_mark_sent(uuid), public.hub_resolve_email(uuid,text) to authenticated;

create table public.hub_mailbox_jobs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  next_run_at timestamptz not null default now(), lease_until timestamptz, lease_token uuid,
  last_error_code text, updated_at timestamptz not null default now()
);
alter table public.hub_mailbox_jobs enable row level security;
revoke all on public.hub_mailbox_jobs from anon,authenticated;
grant all on public.hub_mailbox_jobs to service_role;
create function public.hub_claim_mailboxes() returns table(user_id uuid, lease_token uuid) language plpgsql security definer set search_path = '' as $$
begin
  return query
  with due as (
    select j.user_id from public.hub_mailbox_jobs j
    join public.hub_credentials c on c.user_id = j.user_id and c.kind = 'gmail'
    where j.next_run_at <= now() and (j.lease_until is null or j.lease_until < now())
      and c.metadata->>'background_sync' = 'true'
    order by j.next_run_at for update of j skip locked limit 3
  ) update public.hub_mailbox_jobs j set lease_until = now()+interval '5 minutes',lease_token = gen_random_uuid(),updated_at = now()
    from due where j.user_id = due.user_id returning j.user_id,j.lease_token;
end $$;
revoke all on function public.hub_claim_mailboxes() from public,anon,authenticated;
grant execute on function public.hub_claim_mailboxes() to service_role;

-- Commit email suggestions and the sync checkpoint together. A disconnected/replaced
-- connection cannot be resurrected by an in-flight worker or write new suggestions.
create function public.hub_store_sync_batch(p_user uuid,p_version timestamptz,p_messages jsonb,p_metadata jsonb)
returns boolean language plpgsql security definer set search_path = '' as $$
declare connection public.hub_credentials;
begin
  if jsonb_typeof(p_messages) <> 'array' or jsonb_array_length(p_messages) > 25 then raise exception 'Invalid batch'; end if;
  select * into connection from public.hub_credentials where user_id=p_user and kind='gmail' and updated_at=p_version for update;
  if not found then return false; end if;
  insert into public.hub_email_updates(user_id,application_id,message_id,mailbox,subject,proposed_status,evidence,received_at)
  select p_user,r.application_id,r.message_id,connection.metadata->>'email',r.subject,r.proposed_status,r.evidence,r.received_at
  from jsonb_to_recordset(p_messages) as r(application_id uuid,message_id text,subject text,proposed_status text,evidence text,received_at timestamptz)
  on conflict(user_id,mailbox,message_id) do nothing;
  update public.hub_credentials set metadata=p_metadata,updated_at=clock_timestamp() where user_id=p_user and kind='gmail';
  return true;
end $$;
revoke all on function public.hub_store_sync_batch(uuid,timestamptz,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.hub_store_sync_batch(uuid,timestamptz,jsonb,jsonb) to service_role;

create function public.hub_purge_own_data() returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Unauthorized'; end if;
  delete from public.hub_credentials where user_id=auth.uid();
  delete from public.hub_mailbox_jobs where user_id=auth.uid();
  delete from public.hub_applications where user_id=auth.uid();
  delete from public.hub_email_updates where user_id=auth.uid();
  delete from public.hub_resumes where user_id=auth.uid();
  delete from public.hub_checkins where user_id=auth.uid();
  delete from public.hub_limits where user_id=auth.uid();
end $$;
revoke all on function public.hub_purge_own_data() from public,anon;
grant execute on function public.hub_purge_own_data() to authenticated;
commit;
