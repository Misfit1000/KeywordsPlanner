import { readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const assetsDir = path.resolve('dist/assets');
const entries = [];
for (const name of await readdir(assetsDir)) {
  const file = path.join(assetsDir, name);
  const info = await stat(file);
  if (info.isFile() && /\.(js|css)$/.test(name)) entries.push({ name, bytes: info.size, type: path.extname(name).slice(1) });
}
entries.sort((left, right) => right.bytes - left.bytes);
const totals = entries.reduce((value, entry) => ({ ...value, [entry.type]: (value[entry.type] || 0) + entry.bytes }), {});
const budgets = { largestJavaScriptBytes: 750_000, totalJavaScriptBytes: 2_000_000, totalCssBytes: 350_000 };
const largestJavaScript = entries.find((entry) => entry.type === 'js')?.bytes || 0;
const failures = [];
if (largestJavaScript > budgets.largestJavaScriptBytes) failures.push(`Largest JavaScript chunk is ${largestJavaScript} bytes.`);
if ((totals.js || 0) > budgets.totalJavaScriptBytes) failures.push(`Total JavaScript is ${totals.js} bytes.`);
if ((totals.css || 0) > budgets.totalCssBytes) failures.push(`Total CSS is ${totals.css} bytes.`);
const report = { generatedAt: new Date().toISOString(), budgets, totals, largestJavaScript, files: entries, passed: failures.length === 0, failures };
await writeFile(path.resolve('dist/bundle-report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ passed: report.passed, totals, largestJavaScript, files: entries.length }));
if (failures.length) {
  failures.forEach((failure) => console.error(failure));
  process.exitCode = 1;
}
