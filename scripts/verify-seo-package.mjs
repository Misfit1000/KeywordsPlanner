import fs from 'fs';
import path from 'path';

let fail = false;

function checkFile(p) {
  if (!fs.existsSync(p)) {
    console.error(`FAIL: Missing ${p}`);
    fail = true;
  } else {
    console.log(`PASS: Found ${p}`);
  }
}

const reqFiles = [
  'src/lib/seo/crawler.ts',
  'src/lib/seo/robots.ts',
  'src/lib/seo/sitemap.ts',
  'src/lib/seo/url-utils.ts',
  'src/lib/seo/html-parser.ts',
  'src/lib/seo/scoring.ts',
  'src/lib/seo/checks/runner.ts',
  'src/lib/seo/checks/on-page.ts',
  'src/lib/seo/checks/technical.ts',
  'src/lib/seo/checks/content.ts',
  'src/lib/seo/checks/images.ts',
  'src/lib/seo/checks/links.ts',
  'src/lib/seo/checks/schema.ts',
  'src/lib/seo/checks/social.ts',
  'src/lib/seo/checks/security.ts',
  'src/lib/seo/checks/mobile.ts',
  'src/lib/seo/checks/sitemap.ts',
  'src/lib/seo/checks/robots.ts',
  'src/lib/seo/checks/indexability.ts',
  'src/lib/seo/checks/performance.ts',
  'src/lib/seo/checks/local.ts',
  'src/lib/seo/checks/international.ts',
  'src/lib/audit/audit-runner.ts',
  'src/lib/audit/audit-store.ts',
  'src/lib/audit/types.ts'
];

reqFiles.forEach(checkFile);

// Check SEO check count
let count = 0;
try {
  const registryContent = fs.readFileSync('src/lib/seo/checks/all-checks.ts', 'utf8');
  count = (registryContent.match(/registerCheck/g) || []).length;
} catch (e) {}

console.log(`INFO: Found ${count} SEO checks registered`);
if (count < 70) {
  console.error(`FAIL: Only ${count} checks found. Need >= 70`);
  fail = true;
} else {
  console.log(`PASS: Registered >= 70 SEO checks`);
}

// Check package.json AI packages
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const aiPackages = ['@google/genai', '@google/generative-ai', 'openai', 'ai', '@ai-sdk/google'];
for (const aiPkg of aiPackages) {
  if ((pkg.dependencies && pkg.dependencies[aiPkg]) || (pkg.devDependencies && pkg.devDependencies[aiPkg])) {
    console.error(`FAIL: Found AI package in package.json: ${aiPkg}`);
    fail = true;
  }
}

if (fail) {
  console.error('VERIFICATION FAILED');
  process.exit(1);
} else {
  console.log('VERIFICATION PASSED');
  process.exit(0);
}
