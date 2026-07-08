export const AUDIT_START_DEBOUNCE_MS = 1000;

export function createAuditSubmitGuard(now: () => number = () => Date.now()) {
  let inFlight = false;
  let lastStartedAt = 0;

  return {
    begin() {
      const current = now();
      if (inFlight || current - lastStartedAt < AUDIT_START_DEBOUNCE_MS) {
        return false;
      }
      inFlight = true;
      lastStartedAt = current;
      return true;
    },
    end() {
      inFlight = false;
    },
  };
}
