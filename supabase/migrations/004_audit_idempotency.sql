alter table public.audits
  add column if not exists guest_key_hash text null;

create index if not exists audits_user_url_active_recent_idx
on public.audits (user_id, normalized_url, created_at desc)
where status in ('queued', 'running');

create index if not exists audits_guest_url_active_recent_idx
on public.audits (guest_key_hash, normalized_url, created_at desc)
where user_id is null and status in ('queued', 'running');

create index if not exists audits_guest_active_created_at_idx
on public.audits (guest_key_hash, created_at desc)
where user_id is null and status in ('queued', 'running');
