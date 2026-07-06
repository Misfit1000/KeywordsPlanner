import { AuditIssue } from '../../audit/types';
import { runAllGeneratedChecks } from './all-checks';

export function runAllChecks(pageData: any): AuditIssue[] {
  return runAllGeneratedChecks(pageData);
}
