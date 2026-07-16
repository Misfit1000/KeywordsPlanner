begin;

create table if not exists public.audit_finding_workflow (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits(id) on delete cascade,
  finding_id text null,
  finding_key text not null check (char_length(finding_key) between 1 and 512),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'fixed', 'ignored', 'reopened', 'accepted_risk')),
  priority_override text null
    check (priority_override is null or priority_override in ('critical', 'high', 'medium', 'low', 'info')),
  notes text not null default '' check (char_length(notes) <= 2000),
  due_at timestamptz null,
  resolved_at timestamptz null,
  resolved_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete cascade,
  updated_at timestamptz not null default now(),
  updated_by uuid not null references auth.users(id) on delete cascade,
  version integer not null default 1 check (version > 0),
  unique (audit_id, finding_key)
);

create index if not exists audit_finding_workflow_owner_updated_idx
  on public.audit_finding_workflow (user_id, updated_at desc);
create index if not exists audit_finding_workflow_audit_status_idx
  on public.audit_finding_workflow (audit_id, status, updated_at desc);
create index if not exists audit_finding_workflow_finding_id_idx
  on public.audit_finding_workflow (finding_id) where finding_id is not null;

create or replace function public.validate_audit_finding_workflow()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.audit_issues issue
    where issue.audit_id = new.audit_id
      and (
        (new.finding_id is not null and issue.id = new.finding_id)
        or lower(coalesce(issue.finding_key, '')) = new.finding_key
        or lower(concat_ws('|', issue.category, issue.title, issue.affected_url)) = new.finding_key
      )
  ) then
    raise exception 'finding workflow must reference evidence from the same audit';
  end if;
  return new;
end;
$$;

drop trigger if exists audit_finding_workflow_validate on public.audit_finding_workflow;
create trigger audit_finding_workflow_validate
before insert or update of audit_id, finding_id, finding_key on public.audit_finding_workflow
for each row execute function public.validate_audit_finding_workflow();

drop trigger if exists audit_finding_workflow_set_updated_at on public.audit_finding_workflow;
create trigger audit_finding_workflow_set_updated_at
before update on public.audit_finding_workflow
for each row execute function public.set_updated_at();

alter table public.audit_finding_workflow enable row level security;
alter table public.audit_finding_workflow replica identity full;
alter publication supabase_realtime add table public.audit_finding_workflow;

create policy "audit owners can read finding workflow"
on public.audit_finding_workflow for select
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1 from public.audits
    where audits.id = audit_finding_workflow.audit_id
      and audits.user_id = auth.uid()
  )
);

create policy "audit owners can create finding workflow"
on public.audit_finding_workflow for insert
to authenticated
with check (
  user_id = auth.uid()
  and created_by = auth.uid()
  and updated_by = auth.uid()
  and (resolved_by is null or resolved_by = auth.uid())
  and exists (
    select 1 from public.audits
    where audits.id = audit_finding_workflow.audit_id
      and audits.user_id = auth.uid()
  )
);

create policy "audit owners can update finding workflow"
on public.audit_finding_workflow for update
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1 from public.audits
    where audits.id = audit_finding_workflow.audit_id
      and audits.user_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  and updated_by = auth.uid()
  and (resolved_by is null or resolved_by = auth.uid())
  and exists (
    select 1 from public.audits
    where audits.id = audit_finding_workflow.audit_id
      and audits.user_id = auth.uid()
  )
);

create policy "admins can manage finding workflow"
on public.audit_finding_workflow for all
to authenticated
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

-- Server-only state prevents repeated webhook alerts from stateless API instances.
create table if not exists public.operations_alert_state (
  alert_key text primary key check (char_length(alert_key) between 1 and 120),
  status text not null check (status in ('healthy', 'degraded', 'critical', 'unknown')),
  fingerprint text not null check (char_length(fingerprint) between 1 and 128),
  last_evaluated_at timestamptz not null default now(),
  last_sent_at timestamptz null,
  safe_summary jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists operations_alert_state_set_updated_at on public.operations_alert_state;
create trigger operations_alert_state_set_updated_at
before update on public.operations_alert_state
for each row execute function public.set_updated_at();

alter table public.operations_alert_state enable row level security;
-- Intentionally no anon/authenticated policies. Service-role API code is the only writer.

update public.deployment_versions
set api_schema_version = 13,
    updated_at = now()
where component = 'database';

commit;

-- Verification:
-- select tablename, rowsecurity from pg_tables where schemaname = 'public'
--   and tablename in ('audit_finding_workflow', 'operations_alert_state');
-- select policyname, cmd, roles from pg_policies
--   where schemaname = 'public' and tablename = 'audit_finding_workflow';
-- select tgname from pg_trigger where tgname = 'audit_finding_workflow_validate';
-- select component, api_schema_version from public.deployment_versions where component = 'database';
