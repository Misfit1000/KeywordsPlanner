# Database Migration Deployment

Apply migrations in numeric order. Existing production migrations must not be edited or reordered.

For this release:

1. Apply `supabase/migrations/010_audit_resilience_and_failures.sql` in the database SQL editor.
2. Confirm the new audit status constraint accepts `completed_with_warnings`.
3. Confirm audit/page/issue resilience columns and indexes exist.
4. Confirm `audit_diagnostics` has RLS enabled and no anonymous or authenticated policies.
5. Deploy the API/frontend build.
6. Deploy the matching audit engine build separately.
7. Check the engine health endpoint and run one audit that contains a known broken link.
8. Confirm the report completes with warnings, shows the exact failure type, and the engine remains online.

The repository includes temporary write fallbacks for a rolling deployment, but the migration must be applied before relying on warning metadata. Do not expose service-role credentials to the browser.
