import fs from 'node:fs';
import path from 'node:path';

const removed = [
  'src/lib/audit/audit-runner.ts',
  'src/lib/audit/audit-store.ts',
  'src/lib/audit/event-emitter.ts',
  'src/lib/seo/crawler.ts',
  'src/lib/security/audit-runner.ts',
];

const failures = [];
for (const file of removed) {
  if (fs.existsSync(file)) failures.push(`Legacy local audit file still exists: ${file}`);
}

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(full) : /\.(?:ts|tsx|mts|mjs)$/.test(entry.name) ? [full] : [];
  });
}

for (const file of sourceFiles('src')) {
  const source = fs.readFileSync(file, 'utf8');
  if (/audit-store|audit\/event-emitter|seo\/crawler|audit\/audit-runner|security\/audit-runner/.test(source)) {
    failures.push(`Source still references the legacy local audit engine: ${file}`);
  }
}

const apiSource = fs.readFileSync('src/api/index.ts', 'utf8');
if (/audit-worker|safe-public-fetch|crawlDomain|runAllChecksSafely/.test(apiSource)) {
  failures.push('The Vercel API imports worker/crawler execution code.');
}
const workerSource = fs.readFileSync('src/workers/audit-worker.ts', 'utf8');
for (const required of ['auditRepository', 'safePublicFetch', 'runAllChecksSafely']) {
  if (!workerSource.includes(required)) failures.push(`Production audit worker is missing ${required}.`);
}

if (failures.length) {
  failures.forEach((failure) => console.error(`FAIL: ${failure}`));
  process.exit(1);
}
console.log('PASS: Worker-only audit execution boundary is enforced.');
