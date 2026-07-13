# Publishing Safety

Publication is fail-closed. Quality, source verification, originality, image validation or an explicit no-image decision, and initial-HTML prerendering must all pass. Provider, source, image, similarity, or prerender failures cannot create a partial public article.

Jobs use unique idempotency keys, database leases, `SKIP LOCKED`, bounded attempts, and restart recovery through a unique generation-job/article relationship. Scheduler transitions update only rows still in `scheduled` state, so repeated invocations do not duplicate publication.
