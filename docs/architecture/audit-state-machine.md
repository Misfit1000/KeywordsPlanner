# Audit State Machine

```text
queued -> running -> completed
                  -> completed_with_warnings
                  -> failed
                  -> cancelled
running (expired lease) -> running (recovered by another engine)
```

Only queued or stale-running rows are claimable. A claim writes owner, runtime, start time, and lease expiry. Lease refresh is conditional on the same running audit and engine. Recovery clears partial pages, findings, and report output before a deterministic retry while retaining the activity history.

Terminal writes set progress to 100, store the terminal timestamp, clear current work and lease fields, and emit a terminal event. `completed_with_warnings` is a successful report state, not an engine-health failure.
