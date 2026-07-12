# Audit Workspace

Each stored audit has a routed workspace at `/app/audits/:auditId/:section`. A shared provider loads one owner-checked result snapshot, subscribes to Supabase Realtime only while the audit is active, and removes the subscription at terminal status.

Overview shows the final measured score, pages, findings, response observations, scoring explanation, priority distribution, top fixes, and comparison controls. SEO, technical, crawlability, internal-links, performance, passive-security, and pages routes filter the same shared result instead of independently fetching or inventing data.

Findings use a compact, paginated full-width list with search, category, priority, workflow-status, and failure-type filters. No detail column is reserved while the inspector is closed. Selecting a row opens a bounded inspector with explanation, impact, fix guidance, evidence, source URLs, and checklist controls. Page tables use horizontal overflow instead of clipping.

Audit activity is closed on first use and opens from the fixed Activity button as a desktop drawer or mobile bottom sheet. It keeps its own scroll area, traps keyboard focus, closes with Escape, restores focus, remembers the user's preference, and shows grouped customer-safe warnings.

The workspace shell owns the viewport. Its header and sidebar remain in place while the main report and sidebar navigation scroll independently. Settings and Help remain outside the sidebar navigation scroll area.

The live guest route remains available during a free audit. Opening the account workspace requires sign-in and the API still verifies ownership.
