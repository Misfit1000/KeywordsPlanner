import { SecurityIssue, SecurityAuditSummary } from './types';

export function calculateSecurityScore(issues: SecurityIssue[]) {
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  let infoCount = 0;
  
  const categoryScores: Record<string, number> = {};
  
  issues.forEach(i => {
    if (i.severity === 'critical') criticalCount++;
    else if (i.severity === 'high') highCount++;
    else if (i.severity === 'medium') mediumCount++;
    else if (i.severity === 'low') lowCount++;
    else infoCount++;
    
    categoryScores[i.category] = (categoryScores[i.category] || 0) + (i.weight || 1);
  });
  
  const totalWeight = (criticalCount * 25) + (highCount * 10) + (mediumCount * 3) + lowCount;
  const baseScore = 100 - totalWeight;
  const overallScore = Math.max(0, Math.min(100, Math.round(baseScore)));
  
  const passedChecks: SecurityIssue[] = [];
  
  return {
    securityScore: overallScore,
    categoryScores,
    passedChecks,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    infoCount
  };
}
