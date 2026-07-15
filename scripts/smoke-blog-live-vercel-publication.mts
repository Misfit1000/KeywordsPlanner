if (process.env.ALLOW_LIVE_BLOG_PUBLICATION_TEST !== 'true' || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('Skipped: live publication requires ALLOW_LIVE_BLOG_PUBLICATION_TEST=true and controlled Supabase credentials.');
  process.exit(0);
}
console.log('Skipped: a controlled noindex publication fixture must be selected by an administrator before this destructive opt-in test runs.');
