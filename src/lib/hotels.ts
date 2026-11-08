/* Hotels: loading, the publishing rule, places, themes and the booking link (docs/data-model.md). */
export interface Fact { label: string; value: string; sourceUrl: string; lastVerified: string }
export interface Photo { src: string; srcSmall?: string; srcMid?: string; srcHero?: string; width: number; height: number; credit: string; creditUrl: string; caption?: string }
export interface Hotel {
  slug: string; name: string; operator?: string; brand?: string; country: string; region: string; city?: string; area?: string;
  type: string; themes?: string[]; adultsOnly?: boolean; address?: string; lat?: number | null; lng?: number | null; officialSite: string;
  rooms?: number | null; suites?: number | null; villas?: number | null; opened?: number | null; airport?: { code?: string; minutes?: number } | null;
  tagline?: string; description?: string; highlights?: Fact[]; facts?: Fact[]; photos?: Photo[]; stay22Id?: string | null;
  rating?: { score: number; reviews: number; source?: string; date?: string } | null; price?: { from: number; date?: string } | null;
  booking?: { supplier?: string }; lastVerified?: string;
}

export const SITE = 'https://thesuitebook.com';
export const NAME = 'The Suite Book';
export const MIN_PHOTOS = 5;
export const MIN_REVIEWS = 50;

export const REGIONS = ['Europe', 'North America', 'Caribbean & Latin America', 'Middle East', 'Africa', 'Indian Ocean', 'Asia', 'Oceania'];
export const slugify = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const regionPath = (r: string) => `/region/${slugify(r)}/`;

const files = import.meta.glob('../../data/hotels/*.json', { eager: true, import: 'default' }) as Record<string, Hotel>;
const all = Object.values(files);
export const isPublished = (h: Hotel) => !!(h.name && REGIONS.includes(h.region) && h.officialSite && h.description && (h.photos || []).length >= MIN_PHOTOS);
export const hotels: Hotel[] = all.filter(isPublished).sort((a, b) => REGIONS.indexOf(a.region) - REGIONS.indexOf(b.region) || a.country.localeCompare(b.country) || a.name.localeCompare(b.name));
export const hotelPath = (h: Hotel) => `/hotels/${h.slug}/`;

export const placeLine = (h: Hotel) => [h.city, h.area && h.area !== h.city ? h.area : '', h.country].filter(Boolean).join(', ');
export const paragraphs = (h: Hotel) => (h.description || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
export const newest = (list: Hotel[] = hotels) => list.map((h) => h.lastVerified || '').sort().pop() || '';

/* Responsive photo sources: 640, 1000, 1600 and, for the full-bleed lead, 2400. */
export function srcset(p: Photo, hero = false): string {
  const s = [p.srcSmall && `${p.srcSmall} 640w`, p.srcMid && `${p.srcMid} 1000w`, `${p.src} ${Math.min(p.width || 1600, 1600)}w`];
  if (hero && p.srcHero) s.push(`${p.srcHero} 2400w`);
  return s.filter(Boolean).join(', ');
}
export const leadOf = (h: Hotel) => (h.photos || [])[0];

/* Price bands for the finder, from the Stay22 sample. */
export const BANDS = [
  { id: 'under-1000', label: 'Under US$1,000', test: (p: number) => p < 1000 },
  { id: '1000-2000', label: 'US$1,000 to 2,000', test: (p: number) => p >= 1000 && p < 2000 },
  { id: '2000-plus', label: 'US$2,000 and up', test: (p: number) => p >= 2000 },
];
export const bandOf = (h: Hotel) => (h.price?.from ? BANDS.find((b) => b.test(h.price!.from))?.id || '' : '');

/* Theme pages: the title leads with the search phrase. */
export const THEMES = [
  { id: 'private-island', path: '/private-island-resorts/', title: 'The most exclusive private island resorts', short: 'Private islands', test: (h: Hotel) => h.themes?.includes('private-island') || h.type === 'island',
    intro: 'Resorts that have an island to themselves, or very nearly: the arrival by boat or seaplane, and no one else on the beach.' },
  { id: 'safari', path: '/luxury-safari-lodges/', title: 'The most luxurious safari lodges', short: 'Safari lodges', test: (h: Hotel) => h.themes?.includes('safari') || h.type === 'safari',
    intro: 'Lodges on private concessions and reserves, where the game drive starts at the door.' },
  { id: 'palace', path: '/grand-city-hotels/', title: 'The grandest palace and city hotels', short: 'Palaces and grand hotels', test: (h: Hotel) => !!h.themes?.includes('palace'),
    intro: 'The great addresses of the capitals: the palaces of Paris, the grand hotels of London, Rome and Tokyo.' },
  { id: 'overwater', path: '/overwater-villas/', title: 'The most luxurious overwater villas', short: 'Overwater villas', test: (h: Hotel) => !!h.themes?.includes('overwater'),
    intro: 'Villas on stilts above the lagoon, with a ladder down to the water.' },
  { id: 'mountain', path: '/luxury-mountain-and-ski-hotels/', title: 'The most luxurious mountain and ski hotels', short: 'Mountains and ski', test: (h: Hotel) => !!h.themes?.includes('mountain'),
    intro: 'Hotels in the Alps, the Rockies and the high valleys, from ski-in palaces to lodges above the tree line.' },
];
export const themeHotels = (t: (typeof THEMES)[number]) => hotels.filter(t.test);

/* Country and city pages where three or more hotels share one. */
export interface Place { kind: 'country' | 'city'; name: string; country: string; path: string; list: Hotel[] }
export function places(min = 3): Place[] {
  const out: Place[] = [];
  const by = (key: (h: Hotel) => string) => { const m = new Map<string, Hotel[]>(); for (const h of hotels) { const k = key(h); if (k) m.set(k, [...(m.get(k) || []), h]); } return m; };
  for (const [name, list] of by((h) => h.country)) if (list.length >= min) out.push({ kind: 'country', name, country: name, path: `/destinations/${slugify(name)}/`, list });
  for (const [k, list] of by((h) => (h.city ? `${h.city}|${h.country}` : ''))) {
    const [name, country] = k.split('|');
    if (list.length >= min && name !== country) out.push({ kind: 'city', name, country, path: `/destinations/${slugify(name)}/`, list });
  }
  const seen = new Set<string>();
  return out.filter((p) => (seen.has(p.path) ? false : (seen.add(p.path), true)));
}

/* The booking link (planning/README.md): the exact Booking.com listing, else Expedia by address, else the hotel's own site. */
export interface Booking { url: string; label: string; affiliate: boolean; supplier: 'booking' | 'expedia' | 'direct' }
export function booking(h: Hotel): Booking {
  const sup = h.booking?.supplier;
  if (h.stay22Id && sup !== 'direct') return { url: `https://www.stay22.com/allez/booking/usds_${h.stay22Id}?aid=roamcitymaps&checkin&checkout&adults`, label: 'Check availability', affiliate: true, supplier: 'booking' };
  if (sup !== 'direct' && (h.address || h.city)) {
    const addr = h.address || [h.name, h.city, h.country].filter(Boolean).join(', ');
    return { url: `https://www.stay22.com/allez/expedia?address=${encodeURIComponent(addr)}&aid=roamcitymaps`, label: 'Check availability', affiliate: true, supplier: 'expedia' };
  }
  return { url: h.officialSite, label: 'Reserve with the hotel', affiliate: false, supplier: 'direct' };
}
export const SPONSORED = 'sponsored nofollow noopener';

/* Every source the page cites, once. */
export function sources(h: Hotel): { url: string; date: string }[] {
  const m = new Map<string, string>();
  for (const f of [...(h.facts || []), ...(h.highlights || [])]) if (f.sourceUrl && (!m.get(f.sourceUrl) || f.lastVerified > m.get(f.sourceUrl)!)) m.set(f.sourceUrl, f.lastVerified);
  return [...m].map(([url, date]) => ({ url, date }));
}
export const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };
export const longDate = (iso: string) => (iso ? new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '');
export const num = (n: number) => n.toLocaleString('en-US');
