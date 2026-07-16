import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseMajesticMillionPage } from '../src/lib/backlinks/public-link-signals';

const fixture = `
  <html><body>
    <h1>The Majestic Million</h1>
    <table>
      <thead><tr><th>Position</th><th>Change</th><th>Domain</th><th>TLD</th><th>TLD Rank</th><th>Referring Subnets</th><th>Referring IPs</th></tr></thead>
      <tbody><tr>
        <td>10</td><td>1</td><td><a class="domainname">github.com</a></td><td>.com</td><td>10</td><td>256,487 433</td><td>648,351 111</td>
      </tr></tbody>
    </table>
    <div>Top Million Root Domains List generated on 16 Jul 2026 using data from the Fresh Index</div>
  </body></html>`;

const found = parseMajesticMillionPage(fixture, 'www.github.com', '2026-07-16T00:00:00.000Z');
assert.equal(found.found, true);
assert.equal(found.domain, 'github.com');
assert.equal(found.globalRank, 10);
assert.equal(found.tldRank, 10);
assert.equal(found.referringSubnets, 256_487);
assert.equal(found.referringIps, 648_351);
assert.equal(found.datasetDate, '16 Jul 2026');
assert.equal(found.license, 'CC BY 3.0');

const absent = parseMajesticMillionPage('<html><body><h1>The Majestic Million</h1><p>Unfortunately example-not-ranked.test is not in the Majestic Million.</p><div>Top Million Root Domains List generated on 16 Jul 2026 using data from the Fresh Index</div></body></html>', 'example-not-ranked.test');
assert.equal(absent.found, false);
assert.equal(absent.globalRank, null);
assert.equal(absent.referringSubnets, null);

const source = await readFile('src/lib/backlinks/public-link-signals.ts', 'utf8');
const client = await readFile('src/components/backlinks/PublicLinkSignalsCard.tsx', 'utf8');
const api = await readFile('src/api/index.ts', 'utf8');
assert.match(source, /const PROVIDER_ORIGIN = 'https:\/\/majestic\.com'/);
assert.match(source, /MAX_PROVIDER_RESPONSE_BYTES/);
assert.match(source, /AbortController/);
assert.doesNotMatch(source, /process\.env\..*(MAJESTIC|BACKLINK)/i, 'The public adapter must not require a provider key.');
assert.match(api, /public-link-signals.*maxRequests: 20/);
assert.match(api, /normalizeUserUrl\(rawDomain\)/);
assert.doesNotMatch(client, /public-link-signals['"]/i, 'The browser must import only shared backlink types, not the server provider module.');
assert.match(client, /Try again/);
assert.match(client, /never changes the Crawlio audit score/);

console.log('Public backlink signals smoke test passed.');
