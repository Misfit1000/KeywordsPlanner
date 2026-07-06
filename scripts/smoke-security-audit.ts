import { runSecurityChecks } from '../src/lib/security/checks/runner';
import { calculateSecurityScore } from '../src/lib/security/scoring';
import { SECURITY_CHECK_REGISTRY } from '../src/lib/security/checks/registry';

console.log('Running smoke test...');

const pageData = {
  url: 'http://example.com/login',
  finalUrl: 'http://example.com/login',
  status: 200,
  headers: {},
  fakeCondition: true,
  cookies: [{ name: 'session', value: '123' }]
};

const issues = await runSecurityChecks(pageData);
const scoreResult = calculateSecurityScore(issues);

console.log('Registered Checks Count:', Object.keys(SECURITY_CHECK_REGISTRY).length);
console.log('Issues found:', issues.length);
console.log('Overall Score:', scoreResult.securityScore);

const jsonStr = JSON.stringify({ issues: issues.slice(0, 1) });
console.log('JSON Stringify Output Test:', jsonStr.substring(0, 100) + '...');

if (issues.length > 0 && scoreResult.securityScore < 100 && Object.keys(SECURITY_CHECK_REGISTRY).length > 0) {
  console.log('Smoke test passed successfully.');
} else {
  console.error('Smoke test failed.');
  process.exit(1);
}
