-- Specific crawl failures, warning completion, and service-role-only diagnostics.
-- Apply after migration 009 and before deploying the matching worker release.

alter table public.audits drop constraint if exists audits_status_check;
alter table public.audits
  add constraint audits_status_check
  check (status in ('queued', 'running', 'completed', 'completed_with_warnings', 'failed', 'cancelled'));

alter table public.audits
  add column if not exists warning_count integer not null default 0 check (warning_count >= 0),
  add column if not exists failure_counts jsonb not null default '{}'::jsonb;

alter table public.audit_pages
  add column if not exists fetch_status text not null default 'success' check (fetch_status in ('success', 'failed', 'blocked')),
  add column if not exists failure_code text null,
  add column if not exists failure_category text null,
  add column if not exists safe_title text null,
  add column if not exists safe_explanation text null,
  add column if not exists suggested_action text null,
  add column if not exists retryable boolean not null default false,
  add column if not exists attempt_count integer not null default 1 check (attempt_count >= 1),
  add column if not exists recovered_after_retry boolean not null default false,
  add column if not exists source_url text null,
  add column if not exists anchor_text text null;

alter table public.audit_issues
  add column if not exists check_id text null,
  add column if not exists failure_code text null,
  add column if not exists finding_key text null,
  add column if not exists source_urls jsonb not null default '[]'::jsonb,
  add column if not exists affected_page_count integer not null default 1 check (affected_page_count >= 1);

create table if not exists public.audit_diagnostics (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits(id) on delete cascade,
  affected_url text not null default '',
  failure_code text not null,
  phase text not null default '',
  attempt_count integer not null default 1 check (attempt_count >= 1),
  request_duration_ms integer null,
  worker_id text null,
  internal_details text not null default '',
  created_at timestamptz not null default now()
);

alter table public.audit_diagnostics enable row level security;
-- No anon or authenticated policy is created. Service-role APIs may expose
-- diagnostics only after verifying an administrator account.

create index if not exists audit_pages_failure_code_idx on public.audit_pages (audit_id, failure_code) where failure_code is not null;
create index if not exists audit_issues_failure_code_idx on public.audit_issues (audit_id, failure_code) where failure_code is not null;
create index if not exists audit_issues_finding_key_idx on public.audit_issues (audit_id, finding_key) where finding_key is not null;
create index if not exists audit_diagnostics_audit_created_idx on public.audit_diagnostics (audit_id, created_at desc);

comment on table public.audit_diagnostics is
  'Service-role-only raw audit diagnostics. Never subscribe to or expose this table from browser clients.';
