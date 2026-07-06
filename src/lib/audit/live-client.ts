import { safeJsonFetch } from '../http/safe-json';
import { API_ROUTES } from '../api/routes';
import { AuditLiveEvent } from './events';

export class LiveAuditClient {
  private eventSource: EventSource | null = null;
  private pollInterval: any = null;
  private isPolling = false;

  constructor(
    private auditId: string,
    private callbacks: {
      onEvent: (event: AuditLiveEvent) => void;
      onStatusUpdate: (status: any) => void;
      onError: (err: any) => void;
      onComplete: (data?: any) => void;
    }
  ) {}

  connect() {
    this.eventSource = new EventSource(API_ROUTES.auditEvents(this.auditId));
    
    this.eventSource.addEventListener('audit-event', (e) => {
      try {
        const event: AuditLiveEvent = JSON.parse(e.data);
        this.callbacks.onEvent(event);
      } catch (err) {}
    });

    this.eventSource.addEventListener('audit-complete', (e) => {
      this.disconnect();
      this.callbacks.onComplete();
    });

    this.eventSource.addEventListener('audit-error', (e) => {
      try {
        const data = JSON.parse(e.data);
        this.callbacks.onError(data.error);
      } catch (err) {
        this.callbacks.onError(e.data);
      }
      this.disconnect();
    });

    this.eventSource.onerror = () => {
      this.disconnect();
      this.startPollingFallback();
    };
  }

  private async pollStatus() {
    try {
      const dataResp = await safeJsonFetch<any>(API_ROUTES.auditStatus(this.auditId));
      if (!dataResp.success) throw new Error((dataResp as any).error);
      const data = dataResp.data;
      if (data.success) {
        this.callbacks.onStatusUpdate(data.data);
        if (data.data.latestEvents) {
          data.data.latestEvents.forEach((ev: AuditLiveEvent) => this.callbacks.onEvent(ev));
        }
        if (data.data.status === 'completed' || data.data.status === 'failed') {
          this.disconnect();
          this.callbacks.onComplete();
        }
      }
    } catch (err) {
      console.error('Polling error', err);
    }
  }

  private startPollingFallback() {
    if (this.isPolling) return;
    this.isPolling = true;
    console.warn("Live stream interrupted. Switched to status polling.");
    this.pollInterval = setInterval(() => this.pollStatus(), 2000);
    this.pollStatus(); // initial poll
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isPolling = false;
  }
}
