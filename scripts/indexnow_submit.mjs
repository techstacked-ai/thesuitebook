#!/usr/bin/env node
// Submits every sitemap URL to IndexNow (Bing, which feeds ChatGPT search and Copilot, plus Yandex, Seznam and
// Naver), in batches of 10,000. Ported from the Roam network (GoTokyo scripts/indexnow_submit.mjs). deploy.yml runs
// it after a production deploy on a push to main and on the daily run. The key is the one file named <32 hex>.txt
// in public/, served at the site root.
//
//   node scripts/indexnow_submit.mjs [--dist dist]
import fs from 'node:fs';
import path from 'node:path';

const HOST = 'thesuitebook.com';
const i = process.argv.indexOf('--dist');
const dist = path.resolve(i > 0 ? process.argv[i + 1] : 'dist');
const keyFile = fs.readdirSync('public').find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) { console.error('No IndexNow key file (<32 hex>.txt) in public/'); process.exit(1); }
const key = keyFile.slice(0, 32);

/* The built sitemaps (sitemap-index.xml points at sitemap-0.xml and any more). */
const urls = new Set();
for (const f of fs.readdirSync(dist).filter((f) => /^sitemap-\d+\.xml$/.test(f))) {
  for (const m of fs.readFileSync(path.join(dist, f), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const u = m[1].trim();
    if (u.startsWith(`https://${HOST}/`)) urls.add(u);
  }
}
const list = [...urls];
console.log(`${HOST}: ${list.length} sitemap URLs to submit`);
if (!list.length) process.exit(1);
for (let k = 0; k < list.length; k += 10000) {
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key, keyLocation: `https://${HOST}/${key}.txt`, urlList: list.slice(k, k + 10000) }),
  });
  const body = res.ok ? '' : (await res.text()).slice(0, 300);
  console.log(`Batch ${k / 10000 + 1}: HTTP ${res.status} ${body}`);
  // A new key: IndexNow checks the key file later, and the next run submits again.
  if (/SiteVerificationNotCompleted/.test(body)) { console.log(`::warning::IndexNow key not verified yet for ${HOST}`); continue; }
  if (res.status >= 400 && res.status !== 429) process.exitCode = 1;
}
