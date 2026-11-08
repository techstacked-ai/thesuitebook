// Checks every internal link and asset in a build: href and src on every page must resolve to a file, and page
// links must use the trailing-slash URL. Exit 1 on any broken link.
//   node scripts/check_links.mjs [dist]
import fs from 'node:fs';
import path from 'node:path';
const DIST = path.resolve(process.argv[2] || 'dist');
const pages = [];
(function walk(d) { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) walk(p); else if (f.name.endsWith('.html')) pages.push(p); } })(DIST);
const exists = (u) => {
  const p = path.join(DIST, decodeURIComponent(u));
  if (u.endsWith('/')) return fs.existsSync(path.join(p, 'index.html'));
  return fs.existsSync(p) && fs.statSync(p).isFile();
};
const bad = new Map();
let n = 0;
for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8');
  const from = '/' + path.relative(DIST, file).replace(/index\.html$/, '');
  for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    let u = m[1].replace(/&amp;/g, '&');
    if (/^(https?:|mailto:|tel:|data:|#|javascript:)/.test(u) && !u.startsWith('https://thesuitebook.com/')) continue;
    u = u.replace('https://thesuitebook.com', '').replace(/[?#].*$/, '');
    if (!u) continue;
    if (!u.startsWith('/')) u = path.posix.join(from, u);
    n++;
    const ok = exists(u) && (u.endsWith('/') || /\.[a-z0-9]+$/i.test(u));
    if (!ok) { if (!bad.has(u)) bad.set(u, []); bad.get(u).push(from); }
  }
}
for (const [u, f] of bad) console.log(`BROKEN ${u}  (on ${f.length} pages, e.g. ${f[0]})`);
console.log(`${pages.length} pages, ${n} internal links and assets, ${bad.size} broken`);
process.exit(bad.size ? 1 : 0);
