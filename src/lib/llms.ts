/* llms.txt and llms-full.txt (https://llmstxt.org): what the site is, how its data is sourced, the key pages and,
   in the full file, every published hotel. */
import { hotels, REGIONS, regionPath, hotelPath, placeLine, places, THEMES, themeHotels, paragraphs, SITE } from './hotels';
const abs = (p: string) => `${SITE}${p}`;
export function llms(full: boolean): string {
  const out = [
    '# The Suite Book', '',
    `> The Suite Book (thesuitebook.com) is a guide to the most extraordinary hotels in the world: city palaces, private islands, safari lodges, wilderness and mountain hotels. ${hotels.length} are published. Each hotel page carries its own photographs, rooms and suites, restaurants, the nearest airport, a booking link and the sources of every fact.`, '',
    '## How the data is sourced', '',
    "- Hotel facts come from the hotel's or its operator's own website, press room or fact sheet. Each fact carries its source URL and the date it was read, listed on the hotel page.",
    '- Prices, where shown, are the lowest nightly rate for two adults on Booking.com through Stay22, with the sample date.',
    '- Photographs are the hotels\' own, credited. No hotel pays to be listed. Booking sites, review sites and other directories are never a source.', '',
    '## Key pages', '',
    `- [The hotels](${abs('/hotels/')}): every hotel, filterable by region, country, type and price (search with ?q=)`,
    `- [Destinations](${abs('/destinations/')}): by region, country, city and kind`,
    `- [About](${abs('/about/')}): how the hotels are chosen, and the sources`,
  ];
  const regions = REGIONS.filter((r) => hotels.some((h) => h.region === r));
  if (regions.length) out.push('', '## Regions', '', ...regions.map((r) => `- [The most luxurious hotels in ${r}](${abs(regionPath(r))})`));
  const pl = places(); if (pl.length) out.push('', '## Countries and cities', '', ...pl.map((p) => `- [The most luxurious hotels in ${p.name}](${abs(p.path)}): ${p.list.length} hotels`));
  const th = THEMES.filter((t) => themeHotels(t).length >= 3); if (th.length) out.push('', '## Themes', '', ...th.map((t) => `- [${t.title}](${abs(t.path)})`));
  if (hotels.length) {
    out.push('', '## Hotels', '');
    for (const h of hotels) {
      out.push(`- [${h.name}](${abs(hotelPath(h))}): ${placeLine(h)}${h.tagline ? `. ${h.tagline}` : ''}`);
      if (full) {
        const bits = [h.rooms ? `${h.rooms} rooms` : '', h.opened ? `opened ${h.opened}` : '', h.operator ? `operator ${h.operator}` : '', h.airport?.code ? `airport ${h.airport.code}${h.airport.minutes ? ` (${h.airport.minutes} min)` : ''}` : '', `official site ${h.officialSite}`];
        out.push(`  - ${bits.filter(Boolean).join('; ')}`);
        const a = paragraphs(h)[0]; if (a) out.push(`  - ${a}`);
      }
    }
  }
  if (!full) out.push('', '## Optional', '', `- [Every hotel with its facts](${abs('/llms-full.txt')})`);
  return out.join('\n') + '\n';
}
export const txt = (s: string) => new Response(s, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
