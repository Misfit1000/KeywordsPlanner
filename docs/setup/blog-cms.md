# Blog CMS Setup

SEOIntel includes a public blog and an admin-only publishing workspace. Published posts are readable publicly; drafts and write operations require a server-verified admin account.

## 1. Apply the database migration

1. Open the Supabase dashboard for the SEOIntel project.
2. Open **SQL Editor**.
3. Run `supabase/migrations/007_blog_cms.sql`.
4. Confirm `public.blog_posts` exists and Row Level Security is enabled.
5. Confirm anonymous users can select only published posts and that admin writes use `public.is_admin_user(auth.uid())`.

Run migrations `001` through `006` first on a new project because migration `007` uses the existing user profile and admin helper.

## 2. Configure Gemini on Vercel

Gemini is optional. Manual writing, SEO defaults, drafts, publishing, and the public blog work without it.

1. Create a Gemini API key in Google AI Studio.
2. Open the Vercel project, then **Settings > Environment Variables**.
3. Add `GEMINI_API_KEY` for Production and Preview as needed.
4. Optionally add `GEMINI_MODEL=gemini-2.5-flash`.
5. Redeploy the Vercel project.

Do not create `VITE_GEMINI_API_KEY`. Variables prefixed with `VITE_` are included in browser bundles. The Gemini key is read only by the authenticated admin API route and is rate limited.

## 3. Publish an article

1. Sign in with an account whose `user_profiles.role` is `admin`.
2. Open `/admin/blog`.
3. Write an article or ask Gemini for a draft.
4. Review and fact-check every generated statement and link.
5. Complete the SEO checklist, preview the search snippet, and select **Publish**.

Gemini never publishes directly. The API sanitizes article HTML again before storage, creates a collision-safe slug, and records the admin action.

## 4. Verify discovery

1. Open `/blog` and the published article URL.
2. Open `/sitemap.xml` and confirm the article appears.
3. Add `https://keywordsintel.vercel.app/sitemap.xml` in Google Search Console.
4. Use URL Inspection for an important article and request indexing after verifying the rendered page.
5. Keep titles, descriptions, internal links, and article claims useful and accurate.

SEO metadata and a sitemap make articles discoverable, but no implementation can guarantee a Google ranking. Ranking depends on content quality, competition, site authority, crawl/indexing decisions, and ongoing maintenance.
