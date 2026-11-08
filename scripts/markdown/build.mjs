#!/usr/bin/env node
// Writes <page>/index.md next to every built page (scripts/markdown/html2md.mjs), for AI agents. Runs on the built
// folder after `astro build`, in deploy.yml. Ported from the Roam network (GoTokyo scripts/markdown/build.mjs).
//
//   node scripts/markdown/build.mjs [--dist dist] [--site https://thesuitebook.com]
import fs from 'node:fs';
import path from 'node:path';
import { htmlToMarkdown } from './html2md.mjs';

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const dist = path.resolve(arg('dist', 'dist'));
const site = arg('site', 'https://thesuitebook.com').replace(/\/$/, '');
if (!/^https:\/\/[a-z0-9.-]+$/.test(site)) { console.error('markdown: --site https://<domain> is needed'); process.exit(2); }

let made = 0, skipped = 0, bytes = 0;
const t0 = Date.now();
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!['_astro', 'photos', 'fonts', 'data'].includes(e.name)) walk(p); continue; }
    if (e.name !== 'index.html') continue;
    const rel = path.relative(dist, path.dirname(p)).split(path.sep).join('/');
    const url = `${site}/${rel ? `${rel}/` : ''}`;
    const md = htmlToMarkdown(fs.readFileSync(p, 'utf8'), url);
    if (!md) { skipped++; continue; }
    fs.writeFileSync(path.join(path.dirname(p), 'index.md'), md);
    made++; bytes += Buffer.byteLength(md);
  }
}
walk(dist);
console.log(`markdown: ${made} pages written (${(bytes / 1048576).toFixed(1)} MB), ${skipped} without one, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
if (!made) process.exit(1);
