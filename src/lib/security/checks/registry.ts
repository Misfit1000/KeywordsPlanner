import { SecurityIssue, SecuritySeverity } from '../types';

export interface SecurityCheckDef {
  id: string;
  category: string;
  severity: SecuritySeverity;
  title: string;
  description: string;
  recommendation: string;
  weight: number;
}

export const SECURITY_CHECK_REGISTRY: Record<string, SecurityCheckDef> = {};

export function registerSecurityCheck(def: SecurityCheckDef) {
  SECURITY_CHECK_REGISTRY[def.id] = def;
}
