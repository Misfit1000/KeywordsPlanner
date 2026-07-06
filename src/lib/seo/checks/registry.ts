export interface SeoCheck {
  id: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  recommendation: string;
}

export const CHECK_REGISTRY: Record<string, SeoCheck> = {};

export function registerCheck(check: SeoCheck) {
  CHECK_REGISTRY[check.id] = check;
}
