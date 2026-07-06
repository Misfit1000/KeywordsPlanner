export type SecuritySeverity = "critical" | "high" | "medium" | "low" | "info";

export type SecurityCheckStatus = "pass" | "warning" | "fail" | "info";

export interface SecurityIssue {
  id: string;
  category: string;
  severity: SecuritySeverity;
  status: SecurityCheckStatus;
  title: string;
  description: string;
  evidence: string;
  recommendation: string;
  affectedUrl: string;
  weight: number;
}

export interface SecurityAuditSummary {
  httpsEnabled: boolean;
  redirectsToHttps: boolean;
  securityHeadersPresent: string[];
  securityHeadersMissing: string[];
  cookieCount: number;
  riskyCookieCount: number;
  formsDetected: number;
  insecureFormsDetected: number;
  exposedFilesDetected: number;
}

export interface SecurityAuditResult {
  url: string;
  finalUrl: string;
  scannedAt: string;
  securityScore: number;
  categoryScores: Record<string, number>;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  issues: SecurityIssue[];
  passedChecks: SecurityIssue[];
  summary: SecurityAuditSummary;
}

