export async function safeJsonFetch<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{ success: true; data: T } | { success: false; error: string; status?: number; raw?: string }> {
  try {
    const response = await fetch(input, init);
    const contentType = response.headers.get("content-type") || "";
    const raw = await response.text();

    if (!raw.trim()) {
      return {
        success: false,
        status: response.status,
        error: response.status >= 500
          ? 'The audit service is temporarily unavailable. Please try again shortly.'
          : `The service returned an empty response (HTTP ${response.status}).`,
        raw,
      };
    }

    if (!contentType.includes("application/json")) {
      const serviceUnavailable = response.status >= 500;
      return {
        success: false,
        status: response.status,
        error: serviceUnavailable
          ? `The audit service is temporarily unavailable (HTTP ${response.status}). Please try again shortly.`
          : `The service returned an unexpected response (HTTP ${response.status}).`,
        raw,
      };
    }

    try {
      const parsed = JSON.parse(raw);
      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          error: parsed?.error || parsed?.message || `Request failed with status ${response.status}`,
          raw,
        };
      }

      return {
        success: true,
        data: parsed as T,
      };
    } catch {
      return {
        success: false,
        status: response.status,
          error: response.status >= 500
            ? 'The audit service returned an invalid response. Please try again shortly.'
            : 'The service returned an invalid response.',
        raw,
      };
    }
  } catch {
    return {
      success: false,
      error: 'The service could not be reached. Check your connection and try again.',
    };
  }
}
