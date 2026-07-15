# Vercel blog dispatcher

`/api/tools/blog/jobs/dispatch` accepts `GET` for Vercel Cron and `POST` for internal dispatch. It requires a valid server bearer secret and processes at most three stages. Immediate work may chain at most seven invocations, so the chain is finite. `/api/tools/blog/jobs/recover` releases expired stage leases before bounded dispatch.

Set `BLOG_DISPATCH_SECRET` and Vercel `CRON_SECRET` to independent values of at least 24 characters. The conservative initial database claim allows only one active Vercel blog workflow. The repository uses one daily recovery cron so Vercel Hobby deployments remain valid; immediate chaining handles normal progress. Do not expose either route to browser users.
