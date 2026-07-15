-- Raise only legacy 25-page Full Audit rows. Custom administrator limits are preserved.
update public.plan_limits
set
  max_pages_quick = case when max_pages_quick = 25 then 50 else max_pages_quick end,
  max_pages_standard = 50,
  updated_at = now()
where plan in ('paid', 'agency', 'admin')
  and max_pages_standard = 25;

comment on table public.plan_limits is
  'Server-authoritative audit entitlements. Full Audit supports up to 50 successfully analysed pages; limits remain administrator-configurable.';
