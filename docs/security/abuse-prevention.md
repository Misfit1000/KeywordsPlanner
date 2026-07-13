# Abuse Prevention

Audit targets must pass the public-network URL normalizer and safe-fetch DNS/redirect validation. Production audit admission atomically enforces owner, guest-session, network-hash, normalized-domain, active-audit, daily, and global queue controls.

Mutation requests use strict same-origin CORS behavior, bounded JSON bodies, accepted content types, authenticated ownership checks, and durable limits on expensive routes. Audit IDs are treated as opaque; unauthorized access returns the same not-found response used for absent records.

Administrators can pause Free submissions, enable maintenance, set queue thresholds, and require configured bot verification. All privileged mutations require authorization, confirmation in the UI, a reason, before/after metadata, actor, and timestamp. No shell or arbitrary SQL interface exists.
