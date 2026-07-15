# Content calendar

Administrators can move scheduled or unscheduled articles with mouse drag, touch after an intentional movement threshold, or the keyboard-accessible **Move > Select date and time > Confirm** form. Server validation enforces timezone, blackouts, publishing windows, spacing, daily limits, and optimistic schedule versions.

The latest move can be undone. Articles can return to the deterministic recommended time or to the unscheduled queue. Optimistic changes roll back on conflicts, persist in Supabase, preserve idempotency, and create an administrator audit entry.
