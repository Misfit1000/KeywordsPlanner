# Blog job recovery

An interrupted invocation leaves its lease and completed outputs in Supabase. The recovery RPC selects only expired Vercel blog leases with `FOR UPDATE SKIP LOCKED`, clears ownership, and makes the same stage eligible again. Completion is safe because the expected stage and execution ID must still match.

Temporary Groq errors are deferred with a bounded retry time. Authentication, permission, invalid input, repeated schema, cancellation, and deterministic quality failures are not retried automatically. Administrators can retry or cancel without changing arbitrary workflow state.
