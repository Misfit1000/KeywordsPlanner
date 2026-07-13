# Backups And Restore

Use Supabase-supported database backups before every production migration. Record the backup time, project, migration head, release commit, and operator.

Restore testing should verify account/profile relationships, audit ownership and child cascades, reports, blog publication state, platform settings, and the deployment ledger. Never restore production secrets into a developer database.

For migration 011, rollback means disabling new callers first, waiting for accepted admissions to settle, and reverting application/worker code. Additive tables, nullable columns, functions, and indexes can then be removed selectively if required. Never rewrite migrations 001-010 or delete customer reports merely to resolve a deployment mismatch.
