// Brand words count: dropping "Aman" or "Four Seasons" matched Aman Tokyo to another Tokyo hotel (8 Nov 2026).
// Finds each hotel's exact Stay22 (Booking.com) listing by name, then by a small box around its coordinates with
// several pages, and writes stay22Id, rating and price. Run: NODE_USE_ENV_PROXY=1 node scripts/match_stay22.mjs
import fs from 'node:fs';
const DIR = 'data/hotels', TODAY = new Date().toISOString().slice(0, 10);
const day = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const [ci, co] = [day(150), day(153)];
const STOP = /\b(the|a|an|and|hotel|hotels|resort|resorts|spa|lodge|by|at|of|de|du|la|le|collection|&)\b/g;
const words = (s) => new Set((s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(STOP, ' ').match(/[a-z0-9]{3,}/g) || []);
const wait = (ms) => new Promise((z) => setTimeout(z, ms));
async function get(q) {
  try { const r = await fetch(`https://api.stay22.com/v2/accommodations?${q}&checkin=${ci}&checkout=${co}&adults=2&pageSize=50`, { headers: { 'X-API-KEY': 'proxy-injected' } }); return await r.json(); } catch { return {}; }
}
function best(h, list) {
  const w = words(h.name); let top = null, s = 0;
  for (const x of list) { const xw = words(x.name); const sc = [...w].filter((a) => xw.has(a)).length / Math.max(1, w.size); if (sc > s) { s = sc; top = x; } }
  return s >= 0.75 ? top : null;
}
let found = 0, miss = [];
for (const f of fs.readdirSync(DIR).filter((f) => f.endsWith('.json'))) {
  const p = `${DIR}/${f}`, h = JSON.parse(fs.readFileSync(p, 'utf8'));
  const list = [];
  for (const q of [`${h.name}, ${h.city || h.area || ''}, ${h.country || ''}`, h.name]) { const r = await get('address=' + encodeURIComponent(q)); list.push(...(r.results || [])); await wait(300); }
  let hit = best(h, list);
  if (!hit && h.lat && h.lng) for (const d of [0.003, 0.01]) { for (let pg = 1; pg <= 4 && !hit; pg++) { const r = await get(`nelat=${h.lat + d}&nelng=${h.lng + d}&swlat=${h.lat - d}&swlng=${h.lng - d}&page=${pg}`); hit = best(h, r.results || []); await wait(300); if (!r.meta || !r.meta.hasMore) break; } if (hit) break; }
  if (!hit) { miss.push(h.name); continue; }
  h.stay22Id = hit.id; h.stay22Name = hit.name;
  if (hit.rating && hit.rating.value) h.rating = { score: hit.rating.value, reviews: hit.rating.count ?? 0, stars: hit.rating.hotelStars ?? null, source: 'Booking.com guest rating, via Stay22', lastVerified: TODAY };
  const t = hit.suppliers && hit.suppliers.booking && hit.suppliers.booking.price && hit.suppliers.booking.price.total;
  if (t) h.price = { ...(h.price || {}), from: (h.price && h.price.from) || Math.round(t / 3), typical: Math.round(t / 3), currency: 'USD', source: 'Booking.com price for two adults, via Stay22', lastChecked: TODAY };
  h.booking = { ...(h.booking || {}), supplier: 'booking' };
  fs.writeFileSync(p, JSON.stringify(h, null, 2) + '\n'); found++;
}
console.log(`matched ${found}; not on Booking.com ${miss.length}`); miss.forEach((m) => console.log('  ' + m));
