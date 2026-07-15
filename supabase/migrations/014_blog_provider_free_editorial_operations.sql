-- Provider-free editorial operations and approved source management.
-- Append-only: migrations 001-013 remain unchanged.
begin;

alter table public.blog_posts add column if not exists fixture_test boolean not null default false;
alter table public.blog_posts drop constraint if exists blog_posts_fixture_publication_guard;
alter table public.blog_posts add constraint blog_posts_fixture_publication_guard check (
  fixture_test = false or (status not in ('scheduled','published') and robots_directive like 'noindex%')
);
create index if not exists blog_posts_fixture_idx on public.blog_posts (fixture_test, updated_at desc) where fixture_test = true;

drop policy if exists "published blog posts are public" on public.blog_posts;
create policy "published blog posts are public" on public.blog_posts for select to anon, authenticated
using (status = 'published' and fixture_test = false and robots_directive like 'index%' and published_at is not null and published_at <= now());

create table if not exists public.blog_approved_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  publisher text not null,
  source_url text not null unique,
  feed_type text not null default 'rss' check (feed_type in ('rss','atom','official_blog','changelog','release_notes','manual_url','imported')),
  topic_clusters text[] not null default '{}',
  trust_level text not null default 'unverified' check (trust_level in ('high','medium','low','unverified')),
  source_classification text not null default 'secondary' check (source_classification in ('primary','secondary')),
  enabled boolean not null default true,
  fetch_frequency_minutes integer not null default 360 check (fetch_frequency_minutes between 15 and 10080),
  last_successful_fetch timestamptz null,
  last_failed_fetch timestamptz null,
  safe_failure_code text not null default '',
  latest_item_date timestamptz null,
  duplicate_item_count integer not null default 0 check (duplicate_item_count >= 0),
  notes text not null default '',
  created_by uuid null references public.user_profiles(id) on delete set null,
  updated_by uuid null references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_approved_sources_fetch_idx on public.blog_approved_sources (enabled, last_successful_fetch, updated_at);
create index if not exists blog_approved_sources_topic_idx on public.blog_approved_sources using gin (topic_clusters);

drop trigger if exists set_blog_approved_sources_updated_at on public.blog_approved_sources;
create trigger set_blog_approved_sources_updated_at before update on public.blog_approved_sources for each row execute function public.set_blog_automation_updated_at();

alter table public.blog_approved_sources enable row level security;
drop policy if exists "admins manage approved blog sources" on public.blog_approved_sources;
create policy "admins manage approved blog sources" on public.blog_approved_sources for all to authenticated
using (public.is_admin_user(auth.uid())) with check (public.is_admin_user(auth.uid()));
grant select, insert, update, delete on public.blog_approved_sources to authenticated;

-- Verification:
-- select tablename, rowsecurity from pg_tables where schemaname='public' and tablename='blog_approved_sources';
-- select policyname from pg_policies where schemaname='public' and tablename='blog_approved_sources';
-- select count(*) from public.blog_posts; -- existing content remains unchanged
-- Rollback: export approved-source records, then drop blog_approved_sources only. No existing blog tables are modified.

commit;
