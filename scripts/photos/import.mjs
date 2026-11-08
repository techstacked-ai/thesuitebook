// Imports one photo for one hotel: downloads it, resizes it (640, 1000, 1600 and 2400 wide; 2400 is the
// full-bleed lead size, written only when the original is that wide),
// writes it under public/photos/<slug>/ and records it in the hotel's photos[].
// The only way a photo enters the data (docs/data-model.md, Photos).
//
//   node scripts/photos/import.mjs --slug <slug> --url <image url> --page <page the image was found on>
//     --credit "<credit as the operator or licence requires>" --basis press|cc-by|cc-by-sa|cc0|pdm|owner
//     [--license "CC BY-SA 4.0" --license-url <url> --author "<name>"] [--caption "<text>"] [--min-width 900]
//
//   --file <path> reads a photo saved from the operator's page in a browser, for sites whose image server
//   refuses this script. --page stays required (the operator page it was saved from); --url is then optional
//   and, when known, is the image's original address.

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const args = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith('--')) {
    const key = argv[i].slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) args[key] = true;
    else { args[key] = next; i++; }
  }
}

const BASES = ['press', 'cc-by', 'cc-by-sa', 'cc0', 'pdm', 'owner'];
const slug = args.slug;
const url = args.url;
const page = args.page;
const credit = args.credit;
const basis = args.basis;
const localFile = typeof args.file === 'string' ? args.file : null;
const minWidth = Number(args['min-width'] || 900);

function fail(msg) { console.error(`import: ${msg}`); process.exit(1); }
if (!slug || (!url && !localFile) || !page || !credit || !basis) fail('need --slug, --url (or --file), --page, --credit and --basis');
if (!BASES.includes(basis)) fail(`basis must be one of ${BASES.join(', ')}`);
if (basis.startsWith('cc') || basis === 'pdm') {
  if (!args['license-url'] || !args.author) fail('a Creative Commons or public domain photo needs --license-url and --author');
}
const file = path.join('data/hotels', `${slug}.json`);
if (!fs.existsSync(file)) fail(`no hotel file ${file}`);
const hotel = JSON.parse(fs.readFileSync(file, 'utf8'));
hotel.photos = hotel.photos || [];
if (url && hotel.photos.some((p) => p.sourceImageUrl === url)) { console.log(`already imported: ${url}`); process.exit(0); }

let buf;
if (localFile) {
  if (!fs.existsSync(localFile)) fail(`no file ${localFile}`);
  buf = fs.readFileSync(localFile);
} else {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  const res = await fetch(url, { signal: controller.signal, redirect: 'follow', headers: { 'user-agent': 'TheAllInGuidePhotoImport/1.0 (+https://theallinguide.com)' } }).catch((e) => fail(`download failed: ${e.message}`));
  clearTimeout(timer);
  if (!res.ok) fail(`download failed: HTTP ${res.status}`);
  const type = res.headers.get('content-type') || '';
  if (!/image\//.test(type) && !/\.(jpe?g|png|webp|avif|tiff?)(\?|$)/i.test(url)) fail(`not an image (content-type ${type})`);
  buf = Buffer.from(await res.arrayBuffer());
}

let meta;
try { meta = await sharp(buf).metadata(); } catch (e) { fail(`not a readable image: ${e.message}`); }
if (!meta.width || meta.width < minWidth) fail(`too small: ${meta.width}x${meta.height}, need at least ${minWidth} wide`);

const n = hotel.photos.length + 1;
const dir = path.join('public/photos', slug);
fs.mkdirSync(dir, { recursive: true });
const size = (w, q) => sharp(buf).rotate().resize({ width: w, withoutEnlargement: true }).jpeg({ quality: q, mozjpeg: true, progressive: true }).toBuffer({ resolveWithObject: true });
const large = await size(1600, 82);
fs.writeFileSync(path.join(dir, `${n}.jpg`), large.data);
fs.writeFileSync(path.join(dir, `${n}-1000.jpg`), (await size(1000, 74)).data);
fs.writeFileSync(path.join(dir, `${n}-640.jpg`), (await size(640, 76)).data);
const hero = meta.width >= 2400 ? await size(2400, 80) : null;
if (hero) fs.writeFileSync(path.join(dir, `${n}-2400.jpg`), hero.data);

const entry = {
  src: `/photos/${slug}/${n}.jpg`,
  srcSmall: `/photos/${slug}/${n}-640.jpg`,
  srcMid: `/photos/${slug}/${n}-1000.jpg`,
  srcHero: hero ? `/photos/${slug}/${n}-2400.jpg` : '',
  width: large.info.width,
  height: large.info.height,
  credit,
  creditUrl: page,
  basis,
  license: args.license || '',
  licenseUrl: args['license-url'] || '',
  author: args.author || '',
  sourceImageUrl: url || '',
  ...(localFile ? { localCopy: true } : {}),
  caption: args.caption || '',
  lastVerified: new Date().toISOString().slice(0, 10),
};
hotel.photos.push(entry);
fs.writeFileSync(file, JSON.stringify(hotel, null, 2) + '\n');
console.log(`${slug}: photo ${n} saved, ${entry.width}x${entry.height}, ${Math.round(large.data.length / 1024)} KB, credit "${credit}" (${basis})`);
