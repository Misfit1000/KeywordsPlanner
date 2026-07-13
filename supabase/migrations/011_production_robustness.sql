-- Production controls for durable admission, diagnostics, legal consent, and retention.
-- Apply after migration 010 and before deploying the matching API and audit engine.

create table if not exists public.deployment_versions (
  component text primary key check (component in ('database', 'frontend', 'api', 'worker')),
  application_version text not null,
  commit_identifier text not null,
  build_timestamp timestamptz not null default now(),
  api_schema_version integer not null,
  audit_engine_version text not null,
  scoring_version text not null,
  check_registry_version text not null,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.deployment_versions (
  component, application_version, commit_identifier, api_schema_version,
  audit_engine_version, scoring_version, check_registry_version
) values ('database', '1.0.0-beta', 'migration-011', 11, '2026.07', '2.0', '2.0')
on conflict (component) do update set
  application_version = excluded.application_version,
  commit_identifier = excluded.commit_identifier,
  api_schema_version = excluded.api_schema_version,
  audit_engine_version = excluded.audit_engine_version,
  scoring_version = excluded.scoring_version,
  check_registry_version = excluded.check_registry_version,
  updated_at = now();

create table if not exists public.audit_admissions (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null unique,
  user_id uuid null references auth.users(id) on delete cascade,
  guest_key_hash text null,
  ip_hash text not null,
  normalized_domain text not null,
  normalized_url text not null,
  audit_mode text not null check (audit_mode in ('quick', 'standard', 'deep')),
  decision text not null check (decision in ('accepted', 'released')),
  decision_code text not null,
  created_at timestamptz not null default now(),
  released_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  check ((user_id is not null and guest_key_hash is null) or (user_id is null and guest_key_hash is not null))
);

create table if not exists public.api_rate_limit_windows (
  namespace text not null,
  identifier_hash text not null,
  window_start timestamptz not null,
  window_seconds integer not null check (window_seconds between 1 and 86400),
  request_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (namespace, identifier_hash, window_start)
);

create table if not exists public.api_error_logs (
  request_id text primary key,
  route text not null,
  method text not null,
  user_id uuid null references auth.users(id) on delete set null,
  internal_code text not null,
  internal_details text not null,
  deployment_version text null,
  created_at timestamptz not null default now()
);

create table if not exists public.data_retention_policies (
  data_class text primary key,
  retention_days integer null check (retention_days is null or retention_days > 0),
  description text not null,
  automatic_cleanup boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.data_retention_policies (data_class, retention_days, description, automatic_cleanup) values
  ('verbose_activity_events', 30, 'Detailed audit activity events after report completion.', true),
  ('internal_diagnostics', 30, 'Restricted operational diagnostics.', true),
  ('failed_guest_audits', 7, 'Failed anonymous beta audit records.', true),
  ('stale_queue_records', 7, 'Released admission and expired queue-control records.', true),
  ('completed_page_evidence', 90, 'Page summaries retained for report history; full raw HTML is never stored.', false),
  ('admin_action_logs', 365, 'Privileged action history retained for security accountability.', false),
  ('customer_reports', null, 'Customer reports are retained until the owner deletes them or the account.', false),
  ('published_blog_data', null, 'Published editorial content remains until archived by an administrator.', false)
on conflict (data_class) do update set
  retention_days = excluded.retention_days,
  description = excluded.description,
  automatic_cleanup = excluded.automatic_cleanup,
  updated_at = now();

alter table public.user_profiles
  add column if not exists terms_accepted_at timestamptz null,
  add column if not exists privacy_accepted_at timestamptz null,
  add column if not exists legal_version text null,
  add column if not exists deletion_requested_at timestamptz null;

alter table public.audits
  add column if not exists archived_at timestamptz null,
  add column if not exists deleted_at timestamptz null,
  add column if not exists recovery_attempts integer not null default 0 check (recovery_attempts between 0 and 10),
  add column if not exists last_recovered_at timestamptz null;

alter table public.audits drop constraint if exists audits_status_check;
alter table public.audits
  add constraint audits_status_check check (status in ('queued', 'running', 'completed', 'completed_with_warnings', 'failed', 'cancelled', 'abandoned'));

create index if not exists audit_admissions_owner_day_idx
  on public.audit_admissions (user_id, created_at desc) where decision = 'accepted';
create index if not exists audit_admissions_guest_day_idx
  on public.audit_admissions (guest_key_hash, created_at desc) where decision = 'accepted';
create index if not exists audit_admissions_domain_day_idx
  on public.audit_admissions (normalized_domain, created_at desc) where decision = 'accepted';
create index if not exists audit_admissions_ip_day_idx
  on public.audit_admissions (ip_hash, created_at desc) where decision = 'accepted';
create index if not exists api_rate_limit_expiry_idx
  on public.api_rate_limit_windows (updated_at);
create index if not exists api_error_logs_created_idx
  on public.api_error_logs (created_at desc);
create index if not exists api_error_logs_user_created_idx
  on public.api_error_logs (user_id, created_at desc) where user_id is not null;
create index if not exists audits_active_owner_idx
  on public.audits (user_id, status, created_at desc) where status in ('queued', 'running');
create index if not exists audits_active_guest_idx
  on public.audits (guest_key_hash, status, created_at desc) where user_id is null and status in ('queued', 'running');
create index if not exists audits_admin_status_created_idx
  on public.audits (status, created_at desc, queue_priority desc);
create index if not exists audits_stale_recovery_idx
  on public.audits (status, recovery_attempts, lease_expires_at)
  where status = 'running';
create index if not exists audit_issues_workspace_idx
  on public.audit_issues (audit_id, severity, category, detected_at desc);
create index if not exists audit_diagnostics_failure_created_idx
  on public.audit_diagnostics (failure_code, created_at desc);

alter table public.deployment_versions enable row level security;
alter table public.audit_admissions enable row level security;
alter table public.api_rate_limit_windows enable row level security;
alter table public.api_error_logs enable row level security;
alter table public.data_retention_policies enable row level security;

-- These operational tables intentionally have no anonymous/authenticated policies.
-- Service-role API code exposes only safe, authorised projections.

create or replace function public.consume_api_rate_limit(
  p_namespace text,
  p_identifier_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_start timestamptz;
  v_count integer;
  v_retry integer;
begin
  if p_limit < 1 or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'invalid rate-limit configuration';
  end if;
  v_window_start := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  perform pg_advisory_xact_lock(hashtext('api-rate:' || p_namespace || ':' || p_identifier_hash || ':' || v_window_start::text));

  insert into public.api_rate_limit_windows (namespace, identifier_hash, window_start, window_seconds, request_count)
  values (left(p_namespace, 100), left(p_identifier_hash, 128), v_window_start, p_window_seconds, 1)
  on conflict (namespace, identifier_hash, window_start)
  do update set request_count = public.api_rate_limit_windows.request_count + 1, updated_at = now()
  returning request_count into v_count;

  v_retry := greatest(1, ceil(extract(epoch from (v_window_start + make_interval(secs => p_window_seconds) - now())))::integer);
  return jsonb_build_object(
    'allowed', v_count <= p_limit,
    'count', v_count,
    'limit', p_limit,
    'retry_after_seconds', case when v_count > p_limit then v_retry else 0 end
  );
end;
$$;

create or replace function public.admit_audit_submission(
  p_audit_id uuid,
  p_user_id uuid,
  p_guest_key_hash text,
  p_ip_hash text,
  p_normalized_domain text,
  p_normalized_url text,
  p_audit_mode text,
  p_plan text,
  p_daily_limit integer,
  p_domain_daily_limit integer,
  p_active_limit integer,
  p_global_active_limit integer,
  p_bot_verified boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings jsonb := '{}'::jsonb;
  v_existing_id uuid;
  v_daily_count integer := 0;
  v_network_daily_count integer := 0;
  v_domain_count integer := 0;
  v_global_active integer := 0;
  v_hard_limit integer;
  v_soft_limit integer;
  v_owner_active integer := 0;
begin
  if (p_user_id is null) = (p_guest_key_hash is null) then
    raise exception 'exactly one owner identifier is required';
  end if;
  if p_audit_mode not in ('quick', 'standard', 'deep') then
    raise exception 'unsupported audit mode';
  end if;

  perform pg_advisory_xact_lock(hashtext('seointel-audit-admission'));
  select coalesce(value, '{}'::jsonb) into v_settings
    from public.platform_settings
    where id = 'settings' or key = 'settings'
    order by updated_at desc limit 1;

  if coalesce((v_settings ->> 'maintenanceMode')::boolean, false) then
    return jsonb_build_object('allowed', false, 'code', 'MAINTENANCE', 'auditId', p_audit_id, 'reusedExistingAudit', false, 'retryAfterSeconds', 300);
  end if;
  if p_plan = 'free' and coalesce((v_settings ->> 'pauseFreeSubmissions')::boolean, false) then
    return jsonb_build_object('allowed', false, 'code', 'FREE_SUBMISSIONS_PAUSED', 'auditId', p_audit_id, 'reusedExistingAudit', false, 'retryAfterSeconds', 300);
  end if;
  if p_user_id is null and not coalesce((v_settings ->> 'guestAuditEnabled')::boolean, true) then
    return jsonb_build_object('allowed', false, 'code', 'GUEST_AUDITS_DISABLED', 'auditId', p_audit_id, 'reusedExistingAudit', false, 'retryAfterSeconds', 300);
  end if;
  if coalesce(v_settings -> 'disabledAuditModes', '[]'::jsonb) ? p_audit_mode then
    return jsonb_build_object('allowed', false, 'code', 'AUDIT_MODE_DISABLED', 'auditId', p_audit_id, 'reusedExistingAudit', false, 'retryAfterSeconds', 300);
  end if;
  if p_user_id is null and coalesce((v_settings ->> 'captchaRequired')::boolean, false) and not p_bot_verified then
    return jsonb_build_object('allowed', false, 'code', 'BOT_VERIFICATION_REQUIRED', 'auditId', p_audit_id, 'reusedExistingAudit', false, 'retryAfterSeconds', 60);
  end if;

  select a.id into v_existing_id from public.audits a
    where a.normalized_url = p_normalized_url
      and a.status in ('queued', 'running')
      and a.created_at >= now() - interval '10 minutes'
      and ((p_user_id is not null and a.user_id = p_user_id)
        or (p_user_id is null and a.user_id is null and a.guest_key_hash = p_guest_key_hash))
    order by a.created_at desc limit 1;
  if v_existing_id is not null then
    return jsonb_build_object('allowed', true, 'code', 'DUPLICATE_REUSED', 'auditId', v_existing_id, 'reusedExistingAudit', true, 'retryAfterSeconds', 0);
  end if;

  select aa.audit_id into v_existing_id from public.audit_admissions aa
    where aa.normalized_url = p_normalized_url and aa.decision = 'accepted'
      and aa.created_at >= now() - interval '10 minutes'
      and ((p_user_id is not null and aa.user_id = p_user_id)
        or (p_user_id is null and aa.user_id is null and aa.guest_key_hash = p_guest_key_hash))
    order by aa.created_at desc limit 1;
  if v_existing_id is not null then
    return jsonb_build_object('allowed', true, 'code', 'DUPLICATE_REUSED', 'auditId', v_existing_id, 'reusedExistingAudit', true, 'retryAfterSeconds', 0);
  end if;

  select count(*) into v_owner_active from public.audits a
    where a.status in ('queued', 'running')
      and ((p_user_id is not null and a.user_id = p_user_id)
        or (p_user_id is null and a.user_id is null and a.guest_key_hash = p_guest_key_hash));
  if v_owner_active >= greatest(1, p_active_limit) then
    select a.id into v_existing_id from public.audits a
      where a.status in ('queued', 'running')
        and ((p_user_id is not null and a.user_id = p_user_id)
          or (p_user_id is null and a.user_id is null and a.guest_key_hash = p_guest_key_hash))
      order by a.created_at desc limit 1;
    return jsonb_build_object('allowed', false, 'code', 'ACTIVE_AUDIT_EXISTS', 'auditId', coalesce(v_existing_id, p_audit_id), 'reusedExistingAudit', v_existing_id is not null, 'retryAfterSeconds', 60);
  end if;

  select count(*) into v_daily_count from public.audit_admissions aa
    where aa.decision = 'accepted' and aa.created_at >= date_trunc('day', now())
      and ((p_user_id is not null and aa.user_id = p_user_id)
        or (p_user_id is null and aa.user_id is null and aa.guest_key_hash = p_guest_key_hash));
  if v_daily_count >= greatest(1, p_daily_limit) then
    return jsonb_build_object('allowed', false, 'code', 'DAILY_QUOTA_REACHED', 'auditId', p_audit_id, 'reusedExistingAudit', false, 'retryAfterSeconds', greatest(1, extract(epoch from (date_trunc('day', now()) + interval '1 day' - now()))::integer));
  end if;
  if p_user_id is null then
    select count(*) into v_network_daily_count from public.audit_admissions aa
      where aa.decision = 'accepted' and aa.created_at >= date_trunc('day', now()) and aa.ip_hash = p_ip_hash;
    if v_network_daily_count >= greatest(1, p_daily_limit) then
      return jsonb_build_object('allowed', false, 'code', 'DAILY_QUOTA_REACHED', 'auditId', p_audit_id, 'reusedExistingAudit', false, 'retryAfterSeconds', greatest(1, extract(epoch from (date_trunc('day', now()) + interval '1 day' - now()))::integer));
    end if;
  end if;

  select count(*) into v_domain_count from public.audit_admissions aa
    where aa.decision = 'accepted' and aa.created_at >= date_trunc('day', now())
      and aa.normalized_domain = p_normalized_domain
      and (aa.ip_hash = p_ip_hash or (p_user_id is not null and aa.user_id = p_user_id) or (p_user_id is null and aa.guest_key_hash = p_guest_key_hash));
  if v_domain_count >= greatest(1, p_domain_daily_limit) then
    return jsonb_build_object('allowed', false, 'code', 'DOMAIN_DAILY_LIMIT', 'auditId', p_audit_id, 'reusedExistingAudit', false, 'retryAfterSeconds', 3600);
  end if;

  select count(*) into v_global_active from public.audits where status in ('queued', 'running');
  v_hard_limit := coalesce(nullif((v_settings ->> 'hardQueueLimit')::integer, 0), greatest(1, p_global_active_limit));
  v_soft_limit := coalesce(nullif((v_settings ->> 'softQueueWarning')::integer, 0), greatest(1, floor(v_hard_limit * 0.8)::integer));
  if v_global_active >= v_hard_limit then
    return jsonb_build_object('allowed', false, 'code', 'QUEUE_FULL', 'auditId', p_audit_id, 'reusedExistingAudit', false, 'retryAfterSeconds', 300, 'queueDepth', v_global_active);
  end if;

  insert into public.audit_admissions (
    audit_id, user_id, guest_key_hash, ip_hash, normalized_domain, normalized_url, audit_mode, decision, decision_code
  ) values (
    p_audit_id, p_user_id, p_guest_key_hash, left(p_ip_hash, 128), lower(p_normalized_domain), p_normalized_url, p_audit_mode, 'accepted', 'ACCEPTED'
  );

  return jsonb_build_object(
    'allowed', true,
    'code', 'ACCEPTED',
    'auditId', p_audit_id,
    'reusedExistingAudit', false,
    'retryAfterSeconds', 0,
    'queueDepth', v_global_active + 1,
    'softQueueWarning', v_global_active + 1 >= v_soft_limit
  );
end;
$$;

create or replace function public.release_audit_admission(p_audit_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.audit_admissions
    set decision = 'released', decision_code = left(coalesce(p_reason, 'RELEASED'), 120), released_at = now()
    where audit_id = p_audit_id and decision = 'accepted';
end;
$$;

create or replace function public.consume_user_audit_quota(
  p_user_id uuid,
  p_audit_id uuid,
  p_plan text,
  p_mode text,
  p_pages_limit integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.user_profiles set
    audit_quota_used_daily = audit_quota_used_daily + 1,
    audit_quota_used_monthly = audit_quota_used_monthly + 1,
    updated_at = now()
  where id = p_user_id;

  insert into public.audit_usage_events (user_id, audit_id, plan, mode, pages_limit)
  values (p_user_id, p_audit_id, p_plan, p_mode, p_pages_limit);
end;
$$;

create or replace function public.delete_user_owned_data(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_audits integer := 0;
begin
  select count(*) into v_audits from public.audits where user_id = p_user_id;
  delete from public.audits where user_id = p_user_id;
  delete from public.projects where user_id = p_user_id;
  delete from public.keywords where user_id = p_user_id;
  delete from public.competitors where user_id = p_user_id;
  update public.blog_posts set author_id = null where author_id = p_user_id;
  update public.blog_posts set updated_by = null where updated_by = p_user_id;
  update public.admin_actions set admin_user_id = null where admin_user_id = p_user_id;
  delete from public.user_profiles where id = p_user_id;
  return jsonb_build_object('deletedAudits', v_audits, 'deletedAt', now());
end;
$$;

create or replace function public.run_data_retention_cleanup(p_apply boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_events integer;
  v_diagnostics integer;
  v_guest_audits integer;
  v_admissions integer;
  v_rate_windows integer;
  v_api_errors integer;
begin
  select count(*) into v_events from public.audit_events where created_at < now() - interval '30 days';
  select count(*) into v_diagnostics from public.audit_diagnostics where created_at < now() - interval '30 days';
  select count(*) into v_guest_audits from public.audits where user_id is null and status in ('failed', 'abandoned') and created_at < now() - interval '7 days';
  select count(*) into v_admissions from public.audit_admissions where (decision = 'released' or created_at < now() - interval '30 days') and created_at < now() - interval '7 days';
  select count(*) into v_rate_windows from public.api_rate_limit_windows where updated_at < now() - interval '2 days';
  select count(*) into v_api_errors from public.api_error_logs where created_at < now() - interval '30 days';
  if p_apply then
    delete from public.audit_events where created_at < now() - interval '30 days';
    delete from public.audit_diagnostics where created_at < now() - interval '30 days';
    delete from public.audits where user_id is null and status in ('failed', 'abandoned') and created_at < now() - interval '7 days';
    delete from public.audit_admissions where (decision = 'released' or created_at < now() - interval '30 days') and created_at < now() - interval '7 days';
    delete from public.api_rate_limit_windows where updated_at < now() - interval '2 days';
    delete from public.api_error_logs where created_at < now() - interval '30 days';
  end if;
  return jsonb_build_object('applied', p_apply, 'activityEvents', v_events, 'diagnostics', v_diagnostics, 'failedGuestAudits', v_guest_audits, 'admissions', v_admissions, 'rateWindows', v_rate_windows, 'apiErrors', v_api_errors);
end;
$$;

revoke all on function public.consume_api_rate_limit(text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.admit_audit_submission(uuid, uuid, text, text, text, text, text, text, integer, integer, integer, integer, boolean) from public, anon, authenticated;
revoke all on function public.release_audit_admission(uuid, text) from public, anon, authenticated;
revoke all on function public.consume_user_audit_quota(uuid, uuid, text, text, integer) from public, anon, authenticated;
revoke all on function public.delete_user_owned_data(uuid) from public, anon, authenticated;
revoke all on function public.run_data_retention_cleanup(boolean) from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, text, integer, integer) to service_role;
grant execute on function public.admit_audit_submission(uuid, uuid, text, text, text, text, text, text, integer, integer, integer, integer, boolean) to service_role;
grant execute on function public.release_audit_admission(uuid, text) to service_role;
grant execute on function public.consume_user_audit_quota(uuid, uuid, text, text, integer) to service_role;
grant execute on function public.delete_user_owned_data(uuid) to service_role;
grant execute on function public.run_data_retention_cleanup(boolean) to service_role;

-- Verification SQL (run after applying):
-- select component, api_schema_version, audit_engine_version, scoring_version from public.deployment_versions;
-- select proname from pg_proc where proname in ('admit_audit_submission', 'consume_api_rate_limit', 'delete_user_owned_data');
-- select tablename, rowsecurity from pg_tables where schemaname = 'public' and tablename in ('audit_admissions','api_rate_limit_windows','api_error_logs');
-- Rollback guidance: disable new callers first. Operational tables may be dropped only after queued admissions finish;
-- nullable profile/audit columns and additive indexes can then be removed independently without rewriting migrations 001-010.
