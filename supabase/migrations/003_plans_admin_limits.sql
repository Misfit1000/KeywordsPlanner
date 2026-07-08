create extension if not exists pgcrypto;

create or replace function public.is_admin_user(user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles
    where id = user_id
      and role = 'admin'
  );
$$;

alter table public.user_profiles
  add column if not exists subscription_status text not null default 'inactive',
  add column if not exists audit_quota_used_daily integer not null default 0,
  add column if not exists audit_quota_used_monthly integer not null default 0,
  add column if not exists quota_reset_daily_at timestamptz null,
  add column if not exists quota_reset_monthly_at timestamptz null,
  add column if not exists disabled boolean not null default false;

update public.user_profiles set role = 'user' where role in ('member', 'staff') or role is null;
update public.user_profiles set plan = 'free' where plan is null;
update public.user_profiles set subscription_status = 'inactive' where subscription_status is null;

alter table public.user_profiles
  alter column role set default 'user',
  alter column plan set default 'free',
  alter column subscription_status set default 'inactive',
  alter column audit_quota_used_daily set default 0,
  alter column audit_quota_used_monthly set default 0,
  alter column created_at set default now(),
  alter column updated_at set default now();

alter table public.user_profiles drop constraint if exists user_profiles_role_check;
alter table public.user_profiles drop constraint if exists user_profiles_plan_check;
alter table public.user_profiles drop constraint if exists user_profiles_subscription_status_check;

alter table public.user_profiles
  add constraint user_profiles_role_check check (role in ('user', 'admin', 'support')),
  add constraint user_profiles_plan_check check (plan in ('free', 'paid', 'agency', 'admin')),
  add constraint user_profiles_subscription_status_check check (subscription_status in ('inactive', 'trialing', 'active', 'past_due', 'cancelled'));

create table if not exists public.plan_limits (
  plan text primary key check (plan in ('free', 'paid', 'agency', 'admin')),
  label text not null,
  daily_audits integer not null,
  monthly_audits integer not null,
  max_pages_quick integer not null,
  max_pages_standard integer not null,
  max_pages_deep integer not null,
  allowed_modes jsonb not null,
  audit_timeout_seconds integer not null,
  concurrency integer not null,
  max_events_per_audit integer not null,
  max_issues_per_audit integer not null,
  priority integer not null,
  exports_enabled boolean not null,
  pdf_enabled boolean not null,
  white_label_enabled boolean not null,
  embed_enabled boolean not null,
  api_enabled boolean not null,
  scheduled_audits_enabled boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.plan_limits (
  plan, label, daily_audits, monthly_audits, max_pages_quick, max_pages_standard, max_pages_deep,
  allowed_modes, audit_timeout_seconds, concurrency, max_events_per_audit, max_issues_per_audit,
  priority, exports_enabled, pdf_enabled, white_label_enabled, embed_enabled, api_enabled,
  scheduled_audits_enabled
) values
  ('free', 'Free', 3, 30, 5, 0, 0, '["quick"]'::jsonb, 5, 1, 100, 150, 10, true, false, false, false, false, false),
  ('paid', 'Paid', 25, 500, 10, 25, 0, '["quick","standard"]'::jsonb, 8, 2, 300, 1000, 50, true, true, true, false, false, false),
  ('agency', 'Agency', 100, 3000, 10, 25, 50, '["quick","standard","deep"]'::jsonb, 10, 3, 500, 3000, 100, true, true, true, true, true, true),
  ('admin', 'Admin', 1000, 100000, 10, 25, 75, '["quick","standard","deep"]'::jsonb, 10, 3, 1000, 5000, 999, true, true, true, true, true, true)
on conflict (plan) do update set
  label = excluded.label,
  daily_audits = excluded.daily_audits,
  monthly_audits = excluded.monthly_audits,
  max_pages_quick = excluded.max_pages_quick,
  max_pages_standard = excluded.max_pages_standard,
  max_pages_deep = excluded.max_pages_deep,
  allowed_modes = excluded.allowed_modes,
  audit_timeout_seconds = excluded.audit_timeout_seconds,
  concurrency = excluded.concurrency,
  max_events_per_audit = excluded.max_events_per_audit,
  max_issues_per_audit = excluded.max_issues_per_audit,
  priority = excluded.priority,
  exports_enabled = excluded.exports_enabled,
  pdf_enabled = excluded.pdf_enabled,
  white_label_enabled = excluded.white_label_enabled,
  embed_enabled = excluded.embed_enabled,
  api_enabled = excluded.api_enabled,
  scheduled_audits_enabled = excluded.scheduled_audits_enabled,
  updated_at = now();

alter table public.audits
  add column if not exists plan text not null default 'free',
  add column if not exists requested_mode text not null default 'quick',
  add column if not exists effective_mode text not null default 'quick',
  add column if not exists queue_priority integer not null default 10,
  add column if not exists processing_tier text not null default 'free',
  add column if not exists quota_counted boolean not null default false,
  add column if not exists worker_runtime text null,
  add column if not exists estimated_wait_seconds integer null,
  add column if not exists started_at timestamptz null;

update public.audits
set
  requested_mode = coalesce(nullif(requested_mode, ''), mode, 'quick'),
  effective_mode = coalesce(nullif(effective_mode, ''), mode, 'quick'),
  processing_tier = coalesce(nullif(processing_tier, ''), plan, 'free');

alter table public.audits drop constraint if exists audits_plan_check;
alter table public.audits drop constraint if exists audits_requested_mode_check;
alter table public.audits drop constraint if exists audits_effective_mode_check;
alter table public.audits drop constraint if exists audits_processing_tier_check;

alter table public.audits
  add constraint audits_plan_check check (plan in ('free', 'paid', 'agency', 'admin')),
  add constraint audits_requested_mode_check check (requested_mode in ('quick', 'standard', 'deep')),
  add constraint audits_effective_mode_check check (effective_mode in ('quick', 'standard', 'deep')),
  add constraint audits_processing_tier_check check (processing_tier in ('free', 'paid', 'agency', 'admin'));

create table if not exists public.audit_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  audit_id uuid null references public.audits(id) on delete set null,
  plan text not null default 'free',
  mode text not null default 'quick',
  pages_limit integer null,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid null references auth.users(id) on delete set null,
  action text not null,
  target_type text null,
  target_id text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.platform_settings
  add column if not exists key text null,
  add column if not exists value jsonb not null default '{}'::jsonb;

update public.platform_settings set key = id where key is null;
create unique index if not exists platform_settings_key_idx on public.platform_settings (key);

create index if not exists audits_status_priority_created_at_idx on public.audits (status, queue_priority desc, created_at);
create index if not exists audits_user_created_at_idx on public.audits (user_id, created_at desc);
create index if not exists audit_events_audit_created_at_idx on public.audit_events (audit_id, created_at desc);
create index if not exists audit_pages_audit_crawled_at_idx on public.audit_pages (audit_id, crawled_at desc);
create index if not exists audit_issues_audit_severity_idx on public.audit_issues (audit_id, severity);
create index if not exists platform_settings_key_lookup_idx on public.platform_settings (key);
create index if not exists user_profiles_email_idx on public.user_profiles (email);
create index if not exists user_profiles_plan_idx on public.user_profiles (plan);
create index if not exists audit_usage_events_user_created_at_idx on public.audit_usage_events (user_id, created_at desc);
create index if not exists admin_actions_created_at_idx on public.admin_actions (created_at desc);

drop trigger if exists plan_limits_set_updated_at on public.plan_limits;
create trigger plan_limits_set_updated_at
before update on public.plan_limits
for each row execute function public.set_updated_at();

create or replace function public.guard_user_profile_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.id and not public.is_admin_user(auth.uid()) then
    new.role = old.role;
    new.plan = old.plan;
    new.subscription_status = old.subscription_status;
    new.audit_quota_used_daily = old.audit_quota_used_daily;
    new.audit_quota_used_monthly = old.audit_quota_used_monthly;
    new.quota_reset_daily_at = old.quota_reset_daily_at;
    new.quota_reset_monthly_at = old.quota_reset_monthly_at;
    new.disabled = old.disabled;
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists guard_user_profile_self_update on public.user_profiles;
create trigger guard_user_profile_self_update
before update on public.user_profiles
for each row execute function public.guard_user_profile_self_update();

alter table public.plan_limits enable row level security;
alter table public.audit_usage_events enable row level security;
alter table public.admin_actions enable row level security;

drop policy if exists "audit rows are readable by browser clients" on public.audits;
drop policy if exists "browser clients can enqueue audits only" on public.audits;
drop policy if exists "audit events are readable by browser clients" on public.audit_events;
drop policy if exists "audit pages are readable by browser clients" on public.audit_pages;
drop policy if exists "audit issues are readable by browser clients" on public.audit_issues;
drop policy if exists "audit reports are readable by browser clients" on public.audit_reports;
drop policy if exists "users can read own profile" on public.user_profiles;
drop policy if exists "users can upsert own profile" on public.user_profiles;
drop policy if exists "users can update own profile" on public.user_profiles;
drop policy if exists "users and admins can read profiles" on public.user_profiles;
drop policy if exists "users can create own basic profile" on public.user_profiles;
drop policy if exists "users can update own safe profile fields" on public.user_profiles;
drop policy if exists "users can read own or guest audits" on public.audits;
drop policy if exists "browser clients can enqueue own audits only" on public.audits;
drop policy if exists "admins can update audits" on public.audits;
drop policy if exists "users can read own or guest audit events" on public.audit_events;
drop policy if exists "users can read own or guest audit pages" on public.audit_pages;
drop policy if exists "users can read own or guest audit issues" on public.audit_issues;
drop policy if exists "users can read own or guest audit reports" on public.audit_reports;
drop policy if exists "platform settings are readable" on public.platform_settings;
drop policy if exists "safe platform settings are readable" on public.platform_settings;
drop policy if exists "admins can manage platform settings" on public.platform_settings;
drop policy if exists "plan limits are readable" on public.plan_limits;
drop policy if exists "admins can manage plan limits" on public.plan_limits;
drop policy if exists "users can read own audit usage" on public.audit_usage_events;
drop policy if exists "admins can read audit usage" on public.audit_usage_events;
drop policy if exists "admins can manage admin actions" on public.admin_actions;

create policy "users and admins can read profiles"
on public.user_profiles for select
to authenticated
using (auth.uid() = id or public.is_admin_user(auth.uid()));

create policy "users can create own basic profile"
on public.user_profiles for insert
to authenticated
with check (
  auth.uid() = id
  and role = 'user'
  and plan = 'free'
  and subscription_status = 'inactive'
);

create policy "users can update own safe profile fields"
on public.user_profiles for update
to authenticated
using (auth.uid() = id or public.is_admin_user(auth.uid()))
with check (auth.uid() = id or public.is_admin_user(auth.uid()));

create policy "users can read own or guest audits"
on public.audits for select
to anon, authenticated
using (
  user_id is null
  or user_id = auth.uid()
  or public.is_admin_user(auth.uid())
);

create policy "browser clients can enqueue own audits only"
on public.audits for insert
to authenticated
with check (
  user_id = auth.uid()
  and status = 'queued'
  and locked_by is null
  and locked_at is null
  and lease_expires_at is null
);

create policy "admins can update audits"
on public.audits for update
to authenticated
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

create policy "users can read own or guest audit events"
on public.audit_events for select
to anon, authenticated
using (
  exists (
    select 1 from public.audits a
    where a.id = audit_events.audit_id
      and (a.user_id is null or a.user_id = auth.uid() or public.is_admin_user(auth.uid()))
  )
);

create policy "users can read own or guest audit pages"
on public.audit_pages for select
to anon, authenticated
using (
  exists (
    select 1 from public.audits a
    where a.id = audit_pages.audit_id
      and (a.user_id is null or a.user_id = auth.uid() or public.is_admin_user(auth.uid()))
  )
);

create policy "users can read own or guest audit issues"
on public.audit_issues for select
to anon, authenticated
using (
  exists (
    select 1 from public.audits a
    where a.id = audit_issues.audit_id
      and (a.user_id is null or a.user_id = auth.uid() or public.is_admin_user(auth.uid()))
  )
);

create policy "users can read own or guest audit reports"
on public.audit_reports for select
to anon, authenticated
using (
  exists (
    select 1 from public.audits a
    where a.id = audit_reports.audit_id
      and (a.user_id is null or a.user_id = auth.uid() or public.is_admin_user(auth.uid()))
  )
);

create policy "plan limits are readable"
on public.plan_limits for select
to anon, authenticated
using (true);

create policy "admins can manage plan limits"
on public.plan_limits for all
to authenticated
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

create policy "users can read own audit usage"
on public.audit_usage_events for select
to authenticated
using (user_id = auth.uid() or public.is_admin_user(auth.uid()));

create policy "admins can read audit usage"
on public.audit_usage_events for all
to authenticated
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

create policy "admins can manage admin actions"
on public.admin_actions for all
to authenticated
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

create policy "safe platform settings are readable"
on public.platform_settings for select
to anon, authenticated
using (
  id = 'settings'
  or key = 'settings'
  or public.is_admin_user(auth.uid())
);

create policy "admins can manage platform settings"
on public.platform_settings for all
to authenticated
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));
