# Blog job stages

Stages are: queued, source collection, source validation, topic evaluation, research organisation, content-gap analysis, brief generation, outline generation, section drafting, article assembly, editorial review, metadata generation, claim validation, originality validation, link validation, image processing, quality gate, ready for review, scheduled, publishing, and published.

Each transition verifies the expected stage and lease owner. Output is appended to `stage_outputs`; status text, progress, attempts, safe error, and next retry are stored on the job. Terminal review, schedule, publication, failure, and cancellation states release the lease.
