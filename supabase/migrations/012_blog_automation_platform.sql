-- Append-only blog automation, editorial quality, research, scheduling, and publishing schema.

begin;

alter table public.blog_posts
  add column if not exists tagline text not null default '',
  add column if not exists summary text not null default '',
  add column if not exists origin text not null default 'admin_manual',
  add column if not exists article_type text not null default 'evergreen guide',
  add column if not exists topic_cluster text not null default '',
  add column if not exists language text not null default 'en',
  add column if not exists robots_directive text not null default 'noindex,nofollow',
  add column if not exists og_title text not null default '',
  add column if not exists og_description text not null default '',
  add column if not exists og_image_alt text not null default '',
  add column if not exists og_image_attribution text not null default '',
  add column if not exists reviewer_id uuid null references public.user_profiles(id) on delete set null,
  add column if not exists freshness_status text not null default 'evergreen',
  add column if not exists source_published_at timestamptz null,
  add column if not exists source_updated_at timestamptz null,
  add column if not exists discovered_at timestamptz null,
  add column if not exists continuing_development boolean not null default false,
  add column if not exists scheduled_at timestamptz null,
  add column if not exists publication_reason text not null default '',
  add column if not exists quality_status text not null default 'pending',
  add column if not exists quality_results jsonb not null default '{}'::jsonb,
  add column if not exists originality_status text not null default 'pending',
  add column if not exists originality_results jsonb not null default '{}'::jsonb,
  add column if not exists source_status text not null default 'pending',
  add column if not exists prerender_status text not null default 'pending',
  add column if not exists image_status text not null default 'not_required',
  add column if not exists sources jsonb not null default '[]'::jsonb,
  add column if not exists related_articles jsonb not null default '[]'::jsonb,
  add column if not exists generation_job_id uuid null,
  add column if not exists batch_id uuid null;

alter table public.blog_posts drop constraint if exists blog_posts_status_check;
alter table public.blog_posts add constraint blog_posts_status_check check (status in ('draft', 'review', 'needs_review', 'scheduled', 'published', 'failed', 'archived'));
alter table public.blog_posts add constraint blog_posts_origin_check check (origin in ('autopilot', 'trend_autopilot', 'admin_manual', 'admin_custom_headline', 'admin_batch', 'editor_update', 'scheduled_manual'));
alter table public.blog_posts add constraint blog_posts_freshness_check check (freshness_status in ('high', 'medium', 'low', 'expired', 'evergreen', 'unverified'));
alter table public.blog_posts add constraint blog_posts_quality_status_check check (quality_status in ('pending', 'passed', 'needs_review', 'blocked'));
alter table public.blog_posts add constraint blog_posts_originality_status_check check (originality_status in ('pending', 'passed', 'needs_review', 'blocked'));
alter table public.blog_posts add constraint blog_posts_source_status_check check (source_status in ('pending', 'passed', 'needs_review', 'blocked'));
alter table public.blog_posts add constraint blog_posts_prerender_status_check check (prerender_status in ('pending', 'passed', 'needs_review', 'blocked'));
alter table public.blog_posts add constraint blog_posts_image_status_check check (image_status in ('pending', 'passed', 'needs_review', 'blocked', 'not_required'));
alter table public.blog_posts add constraint blog_posts_schedule_check check (status <> 'scheduled' or scheduled_at is not null);

update public.blog_posts
set robots_directive = 'index,follow,max-image-preview:large',
    origin = coalesce(nullif(origin, ''), 'admin_manual'),
    summary = case when summary = '' then excerpt else summary end,
    og_title = case when og_title = '' then coalesce(nullif(seo_title, ''), title) else og_title end,
    og_description = case when og_description = '' then coalesce(nullif(meta_description, ''), excerpt) else og_description end
where status = 'published';

create index if not exists blog_posts_origin_created_idx on public.blog_posts (origin, created_at desc);
create index if not exists blog_posts_schedule_idx on public.blog_posts (status, scheduled_at) where status = 'scheduled';
create index if not exists blog_posts_quality_idx on public.blog_posts (quality_status, updated_at desc);
create index if not exists blog_posts_cluster_idx on public.blog_posts (topic_cluster, published_at desc);
create unique index if not exists blog_posts_generation_job_unique_idx on public.blog_posts (generation_job_id) where generation_job_id is not null;

create table if not exists public.blog_batches (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  state text not null default 'queued' check (state in ('queued', 'running', 'completed', 'failed', 'cancelled')),
  requested_count integer not null check (requested_count between 1 and 5),
  completed_count integer not null default 0,
  failed_count integer not null default 0,
  settings jsonb not null default '{}'::jsonb,
  maximum_cost numeric(12,4) null check (maximum_cost is null or maximum_cost >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blog_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  origin text not null check (origin in ('autopilot', 'trend_autopilot', 'admin_manual', 'admin_custom_headline', 'admin_batch', 'editor_update', 'scheduled_manual')),
  state text not null default 'queued' check (state in ('queued', 'discovering', 'researching', 'briefing', 'drafting', 'validating', 'checking_originality', 'optimising', 'sourcing_images', 'prerendering', 'ready_for_review', 'scheduled', 'publishing', 'published', 'skipped', 'failed', 'cancelled')),
  topic text not null default '',
  custom_headline text not null default '',
  article_id uuid null references public.blog_posts(id) on delete set null,
  batch_id uuid null references public.blog_batches(id) on delete cascade,
  requested_by uuid null references public.user_profiles(id) on delete set null,
  provider text not null default 'gemini',
  model text not null default '',
  prompt_version text not null default 'blog-v2',
  payload jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  idempotency_key text not null unique,
  attempt_count integer not null default 0,
  max_attempts integer not null default 3 check (max_attempts between 1 and 5),
  estimated_cost numeric(12,4) null,
  actual_cost numeric(12,4) null,
  input_tokens integer null,
  output_tokens integer null,
  scheduled_for timestamptz null,
  locked_by text null,
  locked_at timestamptz null,
  lease_expires_at timestamptz null,
  error text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz null
);

alter table public.blog_posts drop constraint if exists blog_posts_generation_job_id_fkey;
alter table public.blog_posts add constraint blog_posts_generation_job_id_fkey foreign key (generation_job_id) references public.blog_generation_jobs(id) on delete set null;
alter table public.blog_posts drop constraint if exists blog_posts_batch_id_fkey;
alter table public.blog_posts add constraint blog_posts_batch_id_fkey foreign key (batch_id) references public.blog_batches(id) on delete set null;

create index if not exists blog_generation_jobs_queue_idx on public.blog_generation_jobs (state, scheduled_for, created_at) where state = 'queued';
create index if not exists blog_generation_jobs_origin_idx on public.blog_generation_jobs (origin, created_at desc);
create index if not exists blog_generation_jobs_batch_idx on public.blog_generation_jobs (batch_id, created_at);

create table if not exists public.blog_trend_discoveries (
  id uuid primary key default gen_random_uuid(),
  source_url text not null unique,
  source_title text not null,
  publisher text not null,
  author text not null default '',
  published_at timestamptz not null,
  source_updated_at timestamptz null,
  discovered_at timestamptz not null default now(),
  summary text not null default '',
  topic_cluster text not null default '',
  search_intent text not null default '',
  proposed_angle text not null default '',
  audience_relevance numeric(4,3) not null default 0,
  source_authority numeric(4,3) not null default 0,
  novelty numeric(4,3) not null default 0,
  primary_source boolean not null default false,
  continuing_development boolean not null default false,
  existing_coverage boolean not null default false,
  freshness_status text not null default 'unverified',
  age_hours numeric(10,2) null check (age_hours is null or age_hours >= 0),
  priority_label text not null default 'Insufficient evidence',
  priority_reason text not null default '',
  expires_at timestamptz null,
  status text not null default 'monitor' check (status in ('high_priority', 'review', 'monitor', 'covered', 'low_priority', 'insufficient_evidence', 'not_relevant', 'selected', 'skipped')),
  updated_at timestamptz not null default now()
);

create index if not exists blog_trends_priority_idx on public.blog_trend_discoveries (status, freshness_status, published_at desc);
create index if not exists blog_trends_cluster_idx on public.blog_trend_discoveries (topic_cluster, published_at desc);

create table if not exists public.blog_sources (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.blog_posts(id) on delete cascade,
  url text not null,
  title text not null,
  publisher text not null,
  author text not null default '',
  published_at timestamptz null,
  updated_at_source timestamptz null,
  accessed_at timestamptz not null default now(),
  source_type text not null default 'reference',
  supported_claims jsonb not null default '[]'::jsonb,
  primary_source boolean not null default false,
  reliability text not null default 'unverified',
  citation_status text not null default 'needs_review',
  broken_link_status text not null default 'unchecked',
  superseded boolean not null default false,
  unique (article_id, url)
);

create table if not exists public.blog_competitor_research (
  id uuid primary key default gen_random_uuid(),
  article_id uuid null references public.blog_posts(id) on delete cascade,
  reference_url text not null,
  covered_subtopics jsonb not null default '[]'::jsonb,
  format_observations jsonb not null default '[]'::jsonb,
  content_gaps jsonb not null default '[]'::jsonb,
  outdated_information jsonb not null default '[]'::jsonb,
  proposed_original_angle text not null default '',
  traffic_label text not null default 'traffic data unavailable',
  similarity_risk text not null default 'unverified',
  plagiarism_status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.blog_quality_results (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.blog_posts(id) on delete cascade,
  generation_job_id uuid null references public.blog_generation_jobs(id) on delete set null,
  gate_type text not null,
  status text not null check (status in ('passed', 'needs_review', 'blocked')),
  checks jsonb not null default '[]'::jsonb,
  blocked_reasons jsonb not null default '[]'::jsonb,
  checked_at timestamptz not null default now()
);

create table if not exists public.blog_links (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.blog_posts(id) on delete cascade,
  link_type text not null check (link_type in ('internal', 'external', 'related')),
  href text not null,
  anchor_text text not null,
  target_post_id uuid null references public.blog_posts(id) on delete set null,
  canonical boolean not null default false,
  validation_status text not null default 'unchecked',
  last_validated_at timestamptz null,
  unique (article_id, href, anchor_text)
);

create table if not exists public.blog_images (
  id uuid primary key default gen_random_uuid(),
  article_id uuid null references public.blog_posts(id) on delete cascade,
  source_url text not null,
  storage_url text null,
  creator text not null default '',
  publisher text not null default '',
  licence text not null default '',
  attribution text not null default '',
  attribution_url text null,
  width integer null check (width is null or width > 0),
  height integer null check (height is null or height > 0),
  file_type text not null default '',
  file_size integer null check (file_size is null or file_size >= 0),
  alt_text text not null default '',
  caption text not null default '',
  relevance_status text not null default 'needs_review',
  validation_status text not null default 'pending',
  validated_at timestamptz null,
  created_at timestamptz not null default now()
);

create table if not exists public.blog_revisions (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.blog_posts(id) on delete cascade,
  actor_id uuid null references public.user_profiles(id) on delete set null,
  origin text not null,
  previous_state text not null,
  new_state text not null,
  reason text not null default '',
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.blog_publication_events (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.blog_posts(id) on delete cascade,
  generation_job_id uuid null references public.blog_generation_jobs(id) on delete set null,
  actor_id uuid null references public.user_profiles(id) on delete set null,
  event_type text not null,
  previous_state text not null default '',
  new_state text not null default '',
  reason text not null default '',
  scheduled_for timestamptz null,
  created_at timestamptz not null default now()
);

create table if not exists public.blog_autopilot_settings (
  id text primary key default 'default',
  enabled boolean not null default false,
  daily_automatic_limit integer not null default 2 check (daily_automatic_limit between 0 and 2),
  weekly_automatic_limit integer not null default 10 check (weekly_automatic_limit between 0 and 14),
  automatic_timing boolean not null default true,
  timezone text not null default 'UTC',
  preferred_start_hour integer not null default 9 check (preferred_start_hour between 0 and 23),
  preferred_end_hour integer not null default 17 check (preferred_end_hour between 1 and 24),
  minimum_spacing_minutes integer not null default 180 check (minimum_spacing_minutes between 15 and 1440),
  delay_after_discovery_minutes integer not null default 60 check (delay_after_discovery_minutes between 0 and 10080),
  maximum_posts_per_day integer not null default 2 check (maximum_posts_per_day between 0 and 5),
  blackout_weekdays integer[] not null default '{}',
  approved_feed_urls text[] not null default '{}',
  require_review_for_urgent boolean not null default true,
  updated_by uuid null references public.user_profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.blog_autopilot_settings (id) values ('default') on conflict (id) do nothing;

create table if not exists public.blog_topic_hubs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  canonical_url text null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid null references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('blog-images', 'blog-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif','image/avif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read blog images" on storage.objects;
create policy "public read blog images" on storage.objects for select to public using (bucket_id = 'blog-images');
drop policy if exists "admins manage blog images" on storage.objects;
create policy "admins manage blog images" on storage.objects for all to authenticated
using (bucket_id = 'blog-images' and public.is_admin_user(auth.uid()))
with check (bucket_id = 'blog-images' and public.is_admin_user(auth.uid()));

create or replace function public.set_blog_automation_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists set_blog_batches_updated_at on public.blog_batches;
create trigger set_blog_batches_updated_at before update on public.blog_batches for each row execute function public.set_blog_automation_updated_at();
drop trigger if exists set_blog_jobs_updated_at on public.blog_generation_jobs;
create trigger set_blog_jobs_updated_at before update on public.blog_generation_jobs for each row execute function public.set_blog_automation_updated_at();
drop trigger if exists set_blog_trends_updated_at on public.blog_trend_discoveries;
create trigger set_blog_trends_updated_at before update on public.blog_trend_discoveries for each row execute function public.set_blog_automation_updated_at();
drop trigger if exists set_blog_topic_hubs_updated_at on public.blog_topic_hubs;
create trigger set_blog_topic_hubs_updated_at before update on public.blog_topic_hubs for each row execute function public.set_blog_automation_updated_at();

create or replace function public.claim_blog_generation_job(worker_id text, lease_seconds integer default 300)
returns setof public.blog_generation_jobs
language plpgsql security definer set search_path = public as $$
declare claimed public.blog_generation_jobs;
begin
  select * into claimed from public.blog_generation_jobs
  where state in ('queued','discovering','researching','briefing','drafting','validating','checking_originality','optimising','sourcing_images','prerendering','publishing')
    and (scheduled_for is null or scheduled_for <= now())
    and (locked_at is null or lease_expires_at is null or lease_expires_at < now())
  order by created_at asc for update skip locked limit 1;
  if claimed.id is null then return; end if;
  update public.blog_generation_jobs set locked_by = worker_id, locked_at = now(), lease_expires_at = now() + make_interval(secs => greatest(30, least(900, lease_seconds))), attempt_count = attempt_count + 1 where id = claimed.id returning * into claimed;
  return next claimed;
end;
$$;

revoke all on function public.claim_blog_generation_job(text, integer) from public, anon, authenticated;
grant execute on function public.claim_blog_generation_job(text, integer) to service_role;

do $$
declare table_name text;
begin
  foreach table_name in array array['blog_batches','blog_generation_jobs','blog_trend_discoveries','blog_sources','blog_competitor_research','blog_quality_results','blog_links','blog_images','blog_revisions','blog_publication_events','blog_autopilot_settings','blog_topic_hubs'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists "admins manage %s" on public.%I', table_name, table_name);
    execute format('create policy "admins manage %s" on public.%I for all to authenticated using (public.is_admin_user(auth.uid())) with check (public.is_admin_user(auth.uid()))', table_name, table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
  end loop;
end $$;

grant select on public.blog_topic_hubs to anon, authenticated;
drop policy if exists "published blog topic hubs are public" on public.blog_topic_hubs;
create policy "published blog topic hubs are public" on public.blog_topic_hubs for select to anon, authenticated using (status = 'published');

-- Verification queries after deployment:
-- select origin, count(*) from public.blog_posts group by origin;
-- select state, count(*) from public.blog_generation_jobs group by state;
-- select status, freshness_status, count(*) from public.blog_trend_discoveries group by status, freshness_status;

commit;
