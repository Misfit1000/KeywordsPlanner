# Database Migration Deployment

Apply migrations in numeric order. Existing production migrations must not be edited or reordered.

For the audit-resilience release:

1. Apply `supabase/migrations/010_audit_resilience_and_failures.sql` in the database SQL editor.
2. Confirm the new audit status constraint accepts `completed_with_warnings`.
3. Confirm audit/page/issue resilience columns and indexes exist.
4. Confirm `audit_diagnostics` has RLS enabled and no anonymous or authenticated policies.
5. Deploy the API/frontend build.
6. Deploy the matching audit engine build separately.
7. Check the engine health endpoint and run one audit that contains a known broken link.
8. Confirm the report completes with warnings, shows the exact failure type, and the engine remains online.

The repository includes temporary write fallbacks for a rolling deployment, but the migration must be applied before relying on warning metadata. Do not expose service-role credentials to the browser.

## Production robustness release

Apply `supabase/migrations/011_production_robustness.sql` after 010 and before deploying the matching API/audit engine.

1. Create a database backup and record the current migration head.
2. Apply migration 011 in the Supabase SQL editor.
3. Run its verification queries for deployment ledger, RPC functions, and RLS.
4. Confirm the database row reports API schema version 11.
5. Set `RATE_LIMIT_HASH_SECRET` and queue-limit environment variables on Vercel only.
6. Deploy the frontend/API, then deploy the matching Render audit engine commit.
7. Open Admin Diagnostics and confirm database/API/engine/scoring/check-registry compatibility.
8. Run the manual production smoke and one controlled audit.
9. Preview retention cleanup before scheduling apply mode.

If rollback is required, disable audit admission, revert application and engine callers, and follow `docs/production/backups-and-restore.md`. Never rewrite migrations 001-010. Oracle and Stripe work remains postponed.
