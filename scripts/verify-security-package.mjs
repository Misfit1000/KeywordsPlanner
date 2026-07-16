import fs from 'fs';

const REQUIRED_FILES = [
  'src/lib/security/types.ts',
  'src/workers/audit-worker.ts',
  'src/lib/security/safe-public-fetch.ts',
  'src/lib/security/scoring.ts',
  'src/lib/security/fetch-security-page.ts',
  'src/lib/security/checks/runner.ts',
  'src/lib/security/checks/all-checks.ts',
  'src/lib/security/checks/https.ts',
  'src/lib/security/checks/headers.ts',
  'src/lib/security/checks/cookies.ts',
  'src/lib/security/checks/forms.ts',
  'src/lib/security/checks/content-security.ts',
  'src/lib/security/checks/exposed-files.ts'
];

let failed = false;

for (const file of REQUIRED_FILES) {
  if (!fs.existsSync(file)) {
    console.error(`FAIL: Missing required file ${file}`);
    failed = true;
  } else {
    console.log(`PASS: Found ${file}`);
  }
}

// Check if registry has at least 70 checks
let registryContent = '';
try {
  registryContent = fs.readFileSync('src/lib/security/checks/all-checks.ts', 'utf8');
} catch(e) {}

const checkCount = (registryContent.match(/registerSecurityCheck/g) || []).length;
console.log(`INFO: Found ${checkCount} security checks registered`);

if (checkCount < 70) {
  console.error(`FAIL: Need at least 70 security checks, found ${checkCount}`);
  failed = true;
} else {
  console.log(`PASS: Registered >= 70 security checks`);
}

// Check for banned terms
const BANNED_TERMS = ['sqlmap', 'nmap', 'metasploit', 'hydra', 'brute force', 'password cracking'];
let foundBanned = false;
for (const file of REQUIRED_FILES) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8').toLowerCase();
    for (const term of BANNED_TERMS) {
      if (content.includes(term)) {
        console.error(`FAIL: Banned term "${term}" found in ${file}`);
        foundBanned = true;
        failed = true;
      }
    }
  }
}

if (!foundBanned) {
  console.log('PASS: No banned exploit/bruteforce terms found in implementation');
}

if (failed) {
  console.error('\nVERIFICATION FAILED');
  process.exit(1);
} else {
  console.log('\nVERIFICATION PASSED');
  process.exit(0);
}
