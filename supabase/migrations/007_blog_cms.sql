-- Public blog content with admin-only writes and anonymous reads for published posts.

begin;

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  content_html text not null default '',
  content_text text not null default '',
  focus_keyword text null,
  tags text[] not null default '{}',
  seo_title text not null default '',
  meta_description text not null default '',
  canonical_url text null,
  og_image_url text null,
  status text not null default 'draft',
  author_id uuid null references public.user_profiles(id) on delete set null,
  updated_by uuid null references public.user_profiles(id) on delete set null,
  published_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(excerpt, '') || ' ' || coalesce(content_text, ''))
  ) stored,
  constraint blog_posts_slug_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) between 1 and 120),
  constraint blog_posts_title_check check (char_length(title) between 3 and 140),
  constraint blog_posts_excerpt_check check (char_length(excerpt) <= 360),
  constraint blog_posts_content_check check (char_length(content_html) <= 100000),
  constraint blog_posts_seo_title_check check (char_length(seo_title) <= 70),
  constraint blog_posts_meta_description_check check (char_length(meta_description) <= 180),
  constraint blog_posts_status_check check (status in ('draft', 'published', 'archived')),
  constraint blog_posts_tags_check check (cardinality(tags) <= 12)
);

create index if not exists blog_posts_publication_idx
  on public.blog_posts (status, published_at desc)
  where status = 'published';

create index if not exists blog_posts_author_idx on public.blog_posts (author_id, updated_at desc);
create index if not exists blog_posts_search_idx on public.blog_posts using gin (search_vector);

create or replace function public.set_blog_post_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_blog_post_updated_at on public.blog_posts;
create trigger set_blog_post_updated_at
before update on public.blog_posts
for each row execute function public.set_blog_post_updated_at();

alter table public.blog_posts enable row level security;

drop policy if exists "published blog posts are public" on public.blog_posts;
drop policy if exists "admins can manage blog posts" on public.blog_posts;

create policy "published blog posts are public"
on public.blog_posts for select
to anon, authenticated
using (status = 'published' and published_at is not null and published_at <= now());

create policy "admins can manage blog posts"
on public.blog_posts for all
to authenticated
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

grant select on public.blog_posts to anon, authenticated;
grant insert, update, delete on public.blog_posts to authenticated;

commit;
