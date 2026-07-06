import { SecurityIssue } from '../types';
import { auditStore } from '../../audit/audit-store';
import { eventEmitter } from '../../audit/event-emitter';

const SAFE_PATHS = [
  '/.git/config',
  '/.env',
  '/.env.local',
  '/wp-config.php.bak',
  '/config.json'
];

export async function run(pageData: any, auditId?: string): Promise<SecurityIssue[]> {
  const issues: SecurityIssue[] = [];
  const origin = new URL(pageData.url).origin;
  
  for (const path of SAFE_PATHS) {
    // Check handled by outer loop
    
    try {
      const url = `${origin}${path}`;
      const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': 'SEOIntel-Bot' } });
      
      if (res.ok) {
        issues.push({
          id: `exposed-${path.replace(/[^a-zA-Z0-9]/g, '')}`,
          category: 'configuration',
          title: `Potentially Exposed File: ${path}`,
          description: `The file ${path} seems to be publicly accessible, which could leak sensitive information.`,
          severity: 'critical',
          affectedUrl: url,
          status: 'fail',
          evidence: url,
          recommendation: 'Ensure sensitive files are not publicly accessible.',
          weight: 10
        });
        
        // Issue emission is handled by outer loop
      }
      
      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (e) {
      // Ignore network errors
    }
  }

  return issues;
}
