-- Restrict direct browser reads to authenticated owners and admins.
-- Guest audits remain available through identity-protected Vercel API polling.

begin;

drop policy if exists "audit rows are readable by browser clients" on public.audits;
drop policy if exists "audit events are readable by browser clients" on public.audit_events;
drop policy if exists "audit pages are readable by browser clients" on public.audit_pages;
drop policy if exists "audit issues are readable by browser clients" on public.audit_issues;
drop policy if exists "audit reports are readable by browser clients" on public.audit_reports;

drop policy if exists "users can read own or guest audits" on public.audits;
drop policy if exists "users can read own or guest audit events" on public.audit_events;
drop policy if exists "users can read own or guest audit pages" on public.audit_pages;
drop policy if exists "users can read own or guest audit issues" on public.audit_issues;
drop policy if exists "users can read own or guest audit reports" on public.audit_reports;

drop policy if exists "owners and admins can read audits" on public.audits;
drop policy if exists "owners and admins can read audit events" on public.audit_events;
drop policy if exists "owners and admins can read audit pages" on public.audit_pages;
drop policy if exists "owners and admins can read audit issues" on public.audit_issues;
drop policy if exists "owners and admins can read audit reports" on public.audit_reports;

create policy "owners and admins can read audits"
on public.audits for select
to authenticated
using (user_id = auth.uid() or public.is_admin_user(auth.uid()));

create policy "owners and admins can read audit events"
on public.audit_events for select
to authenticated
using (
  exists (
    select 1 from public.audits a
    where a.id = audit_events.audit_id
      and (a.user_id = auth.uid() or public.is_admin_user(auth.uid()))
  )
);

create policy "owners and admins can read audit pages"
on public.audit_pages for select
to authenticated
using (
  exists (
    select 1 from public.audits a
    where a.id = audit_pages.audit_id
      and (a.user_id = auth.uid() or public.is_admin_user(auth.uid()))
  )
);

create policy "owners and admins can read audit issues"
on public.audit_issues for select
to authenticated
using (
  exists (
    select 1 from public.audits a
    where a.id = audit_issues.audit_id
      and (a.user_id = auth.uid() or public.is_admin_user(auth.uid()))
  )
);

create policy "owners and admins can read audit reports"
on public.audit_reports for select
to authenticated
using (
  exists (
    select 1 from public.audits a
    where a.id = audit_reports.audit_id
      and (a.user_id = auth.uid() or public.is_admin_user(auth.uid()))
  )
);

commit;
