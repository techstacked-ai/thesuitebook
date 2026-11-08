# Data model: one JSON file per hotel in data/hotels/<slug>.json

Every fact comes from the hotel's or its operator's own pages (the hotel site, the brand site, the operator's press room or fact sheet). Never OTAs, review sites, aggregators, blogs, magazines' lists or other directories. A field the hotel does not print stays empty (null, "" or []). Never guess.

```json
{
  "slug": "cheval-blanc-paris",
  "name": "Cheval Blanc Paris",
  "operator": "LVMH Hotel Management",
  "brand": "Cheval Blanc",
  "country": "France",
  "region": "Europe",
  "city": "Paris",
  "area": "",
  "type": "city",
  "themes": ["palace"],
  "adultsOnly": false,
  "address": "8 Quai du Louvre, 75001 Paris, France",
  "lat": 48.8587,
  "lng": 2.3424,
  "officialSite": "https://www.chevalblanc.com/en/maison/paris/",
  "rooms": 72,
  "suites": 46,
  "villas": null,
  "opened": 2021,
  "airport": { "code": "CDG", "minutes": 45 },
  "tagline": "",
  "description": "",
  "highlights": [{ "label": "Signature suite", "value": "", "sourceUrl": "", "lastVerified": "2026-11-08" }],
  "facts": [{ "label": "Rooms and suites", "value": "72", "sourceUrl": "https://...", "lastVerified": "2026-11-08" }],
  "photos": [],
  "stay22Id": null,
  "rating": null,
  "price": null,
  "booking": { "supplier": "expedia" },
  "lastVerified": "2026-11-08"
}
```

- `slug`: lower-case words with hyphens, the file name.
- `region`: one of Europe, North America, Caribbean & Latin America, Middle East, Africa, Indian Ocean, Asia, Oceania.
- `country` in English; `city` the town or city as printed (Paris, Courchevel, Ubud); `area` an optional island, lake or district (Lake Como, Madeira).
- `type`: city, resort, island, safari or wilderness. One only.
- `themes`: zero or more of private-island, safari, palace, overwater, mountain. Each one backed by the hotel's own description: palace for the grand city hotels and palace hotels, overwater for villas standing over water, mountain for alpine, ski and mountain hotels, private-island when the hotel is the only one on its island, safari for game lodges.
- `adultsOnly`: true only when the hotel says so; leave false otherwise.
- `rooms`, `suites`, `villas`: whole numbers only when the hotel prints one number; otherwise null, and the wording goes in `facts`.
- `opened`: the year the hotel (or the current hotel, after a rebuild) opened, when printed.
- `airport`: code and transfer minutes only when the hotel prints them.
- `tagline`: one line of at most 90 characters (docs/voice.md).
- `description`: 300 to 500 words in the finished shape of docs/voice.md. Paragraphs separated by a blank line (\n\n). Every sentence rests on a fact in the file.
- `highlights`: four to eight short facts: the signature suite, the restaurant worth naming, the spa, the experiences. `{ label, value, sourceUrl, lastVerified }`; the value is one sentence at most.
- `facts`: every number and claim used above, with the page it came from: `{ label, value, sourceUrl, lastVerified }`.
- `photos`: only through `NODE_USE_ENV_PROXY=1 node scripts/photos/import.mjs --slug <slug> --url <image> --page <page it was on> --credit "<hotel or operator>" --basis press`. The hotel's own images from its site or the operator's media pages; look at each image first; no identifiable person as the main subject. Five to ten per hotel; the first is the lead, a wide landscape of 2000px or wider that shows the place (it runs full-bleed). After imports, nothing else to run: import.mjs writes the 640, 1000, 1600 and 2400 sizes.
- `stay22Id`: the Booking.com property id from Stay22 (planning/candidates.json `stay22`), only when the match is the right hotel. With it the button opens that exact listing.
- `rating`: `{ score, reviews, source: "booking", date }` from the Stay22 match, or null. Shown in schema only at 50 reviews or more.
- `price`: `{ from: <USD per night>, date }` from the Stay22 sample, or null. Used for the price band filter only (under 1,000, 1,000 to 2,000, 2,000 and up).
- `booking.supplier`: booking (stay22Id known), expedia (Allez by address) or direct (no affiliate, the hotel's own site). The site computes the link (src/lib/hotels.ts, bookUrl).
- `lastVerified`: the date the file was last checked as a whole.

A hotel is published when it has a name, region, officialSite, a description and five or more photos.

- `closedUntil` (optional string): a note while the hotel is closed (renovation, rebuilding). The hotel is not published while it is set. Remove it when the hotel reopens.
