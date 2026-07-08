update public.plan_limits
set
  label = 'Paid Full Audit',
  max_pages_quick = 25,
  max_pages_standard = 25,
  max_pages_deep = 0,
  audit_timeout_seconds = 8,
  concurrency = 2,
  max_events_per_audit = 300,
  max_issues_per_audit = 1000,
  updated_at = now()
where plan = 'paid';

update public.plan_limits
set
  max_pages_quick = 25,
  max_pages_standard = 25,
  max_pages_deep = 75,
  audit_timeout_seconds = 12,
  concurrency = 4,
  max_events_per_audit = 800,
  max_issues_per_audit = 4000,
  updated_at = now()
where plan = 'agency';

update public.plan_limits
set
  label = 'Admin Full Audit',
  max_pages_quick = 25,
  max_pages_standard = 25,
  max_pages_deep = 100,
  audit_timeout_seconds = 12,
  concurrency = 4,
  max_events_per_audit = 1500,
  max_issues_per_audit = 7000,
  updated_at = now()
where plan = 'admin';
