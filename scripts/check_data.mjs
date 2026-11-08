// Checks every hotel file against docs/data-model.md. Exit 1 on any error.
//   node scripts/check_data.mjs [--slug <slug>]
import fs from 'node:fs';
import path from 'node:path';
const ONLY = (() => { const i = process.argv.indexOf('--slug'); return i > -1 ? process.argv[i + 1] : ''; })();
const DIR = 'data/hotels';
const REGIONS = ['Europe', 'North America', 'Caribbean & Latin America', 'Middle East', 'Africa', 'Indian Ocean', 'Asia', 'Oceania'];
const TYPES = ['city', 'resort', 'island', 'safari', 'wilderness'];
const THEMES = ['private-island', 'safari', 'palace', 'overwater', 'mountain'];
const SUPPLIERS = ['booking', 'expedia', 'direct'];
const BANNED = /\b(nestled|luxurious|stunning|breathtaking|boasts?|elevate[sd]?|curated|iconic|unparalleled|world-class|paradise|oasis|haven|exquisite|indulge(nt)?)\b/i;
const errs = [], warns = [];
let n = 0, ready = 0, photos = 0;
const isUrl = (u) => /^https?:\/\//.test(u || '');
const isDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d || '');
fs.mkdirSync(DIR, { recursive: true });
for (const f of fs.readdirSync(DIR).filter((f) => f.endsWith('.json') && (!ONLY || f === `${ONLY}.json`)).sort()) {
  const tag = f.replace(/\.json$/, '');
  const raw = fs.readFileSync(path.join(DIR, f), 'utf8');
  if (/[—–]/.test(raw)) errs.push(`${tag}: em or en dash`);
  let h;
  try { h = JSON.parse(raw); } catch (e) { errs.push(`${tag}: JSON ${e.message}`); continue; }
  n++;
  if (h.slug !== tag) errs.push(`${tag}: slug is not the file name`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(tag)) errs.push(`${tag}: slug must be lower-case words and hyphens`);
  if (!h.name) errs.push(`${tag}: no name`);
  if (!REGIONS.includes(h.region)) errs.push(`${tag}: region "${h.region}"`);
  if (!h.country) errs.push(`${tag}: no country`);
  if (!TYPES.includes(h.type)) errs.push(`${tag}: type "${h.type}"`);
  for (const t of h.themes || []) if (!THEMES.includes(t)) errs.push(`${tag}: theme "${t}"`);
  if (h.adultsOnly !== undefined && typeof h.adultsOnly !== 'boolean') errs.push(`${tag}: adultsOnly must be true or false`);
  for (const k of ['rooms', 'suites', 'villas']) if (h[k] !== null && h[k] !== undefined && !(Number.isInteger(h[k]) && h[k] > 0)) errs.push(`${tag}: ${k} "${h[k]}"`);
  if (h.opened !== null && h.opened !== undefined && !(Number.isInteger(h.opened) && h.opened > 1700 && h.opened <= 2030)) errs.push(`${tag}: opened "${h.opened}"`);
  if (h.lat != null && (typeof h.lat !== 'number' || Math.abs(h.lat) > 90)) errs.push(`${tag}: lat`);
  if (h.lng != null && (typeof h.lng !== 'number' || Math.abs(h.lng) > 180)) errs.push(`${tag}: lng`);
  if (h.airport && (h.airport.code || h.airport.minutes) && !(/^[A-Z]{3}$/.test(h.airport.code || '') )) errs.push(`${tag}: airport code "${h.airport.code}"`);
  if (!isUrl(h.officialSite)) errs.push(`${tag}: no officialSite`);
  if (h.booking && h.booking.supplier && !SUPPLIERS.includes(h.booking.supplier)) errs.push(`${tag}: booking.supplier "${h.booking.supplier}"`);
  if (h.booking?.supplier === 'booking' && !h.stay22Id) errs.push(`${tag}: supplier booking without stay22Id`);
  if (h.rating && !(typeof h.rating.score === 'number' && Number.isInteger(h.rating.reviews))) errs.push(`${tag}: rating needs score and reviews`);
  if (h.price && !(typeof h.price.from === 'number' && h.price.from > 0)) errs.push(`${tag}: price.from`);
  for (const [list, items] of [['fact', h.facts || []], ['highlight', h.highlights || []]]) for (const x of items) {
    if (!x.label || !x.value) errs.push(`${tag}: ${list} without label or value`);
    if (!isUrl(x.sourceUrl)) errs.push(`${tag}: ${list} "${x.label}" without source`);
    if (!isDate(x.lastVerified)) errs.push(`${tag}: ${list} "${x.label}" without date`);
  }
  const texts = [h.description || '', h.tagline || '', ...(h.highlights || []).map((x) => x.value || '')].join('\n');
  const b = texts.match(BANNED); if (b) errs.push(`${tag}: "${b[0]}" in the copy`);
  if (/\b(we|our|us|my)\b|\bI\b/.test(texts)) errs.push(`${tag}: first person`);
  if (/!/.test(texts)) errs.push(`${tag}: exclamation mark`);
  if ((h.tagline || '').length > 90) errs.push(`${tag}: tagline over 90 characters`);
  const words = (h.description || '').split(/\s+/).filter(Boolean).length;
  if (h.description && (words < 300 || words > 500)) warns.push(`${tag}: description ${words} words (300 to 500)`);
  for (const [i, p] of (h.photos || []).entries()) {
    photos++;
    if (!p.src || !fs.existsSync(path.join('public', p.src))) errs.push(`${tag} photo ${i + 1}: file missing`);
    if (!p.credit || !p.creditUrl) errs.push(`${tag} photo ${i + 1}: no credit`);
  }
  const pub = h.name && REGIONS.includes(h.region) && isUrl(h.officialSite) && h.description && (h.photos || []).length >= 5;
  if (pub) ready++; else warns.push(`${tag}: not published yet (${(h.photos || []).length} photos${h.description ? '' : ', no description'})`);
}
console.log(`hotels ${n}, publishable ${ready} (${photos} photos), errors ${errs.length}, notes ${warns.length}`);
for (const w of warns) console.log('NOTE ' + w);
for (const e of errs) console.log('ERR ' + e);
process.exit(errs.length ? 1 : 0);
