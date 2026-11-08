# Hotels for a browser session (8 Nov 2026)

These sites refused every request from the cloud research agents (403, Cloudflare, Akamai, Vercel or Incapsula challenges, or a blocked host). Research them from a session on the owner's computer, in the owner's own Chrome (Claude in Chrome), following docs/research-brief.md: facts from the hotel's or operator's own pages, 5 to 8 of the hotel's own photographs through scripts/photos/import.mjs (save images to a scratch folder and use `--file` with `--url` set to the page or image address), `node scripts/check_data.mjs --slug <slug>` at 0 errors. Never solve a captcha; if a page shows one, skip it and note it here. Coordinates, website guesses and Stay22 ids for most of these are in planning/candidates.json.

## Not written yet (no file)

### Europe
- Le Bristol Paris: https://www.oetkercollection.com/hotels/le-bristol-paris/
- Hotel du Cap-Eden-Roc: https://www.oetkercollection.com/hotels/hotel-du-cap-eden-roc/
- Ritz Paris: https://www.ritzparis.com/
- Hôtel Plaza Athénée: https://www.dorchestercollection.com/en/paris/hotel-plaza-athenee/
- Cheval Blanc Paris: https://www.chevalblanc.com/en/maison/paris/
- Cheval Blanc Courchevel: https://www.chevalblanc.com/en/maison/courchevel/
- The Dorchester: https://www.dorchestercollection.com/en/london/the-dorchester/
- Passalacqua: https://www.passalacqua.it/ (passalacqua.com is a coffee company, not the hotel)
- Villa Feltrinelli: https://www.villafeltrinelli.com/
- Badrutt's Palace: https://www.badruttspalace.com/
- The Retreat at Blue Lagoon Iceland: https://www.bluelagoon.com/retreat

### Americas and Middle East
- The Pierre, A Taj Hotel: https://www.tajhotels.com/en-in/taj/the-pierre-new-york/
- The Beverly Hills Hotel: https://www.dorchestercollection.com/en/los-angeles/the-beverly-hills-hotel/
- Hotel Bel-Air: https://www.dorchestercollection.com/en/los-angeles/hotel-bel-air/
- Cheval Blanc St-Barth Isle de France: https://www.chevalblanc.com/en/maison/st-barth/
- Sandy Lane: https://www.sandylane.com/
- Necker Island: https://www.virginlimitedition.com/en/necker-island
- Bulgari Resort Dubai: https://www.bulgarihotels.com/en_US/dubai
- Al Maha, a Luxury Collection Desert Resort & Spa: https://www.marriott.com/en-us/hotels/dxbal-al-maha-a-luxury-collection-desert-resort-and-spa-dubai/overview/
- Six Senses Zighy Bay: https://www.sixsenses.com/en/resorts/zighy-bay

### Asia and Indian Ocean
- The Peninsula Hong Kong: https://www.peninsula.com/en/hong-kong/5-star-luxury-hotel-tsim-sha-tsui
- Capella Singapore: https://www.capellahotels.com/en/capella-singapore
- Taj Lake Palace, Udaipur: https://www.tajhotels.com/ (IHCL press: ihcltata.com)
- Umaid Bhawan Palace, Jodhpur: https://www.tajhotels.com/
- Rambagh Palace, Jaipur: https://www.tajhotels.com/
- Tawaraya Ryokan, Kyoto: https://www.kyoto-tawaraya.jp/en/ (the cloud network refused the host)
- Cheval Blanc Randheli: https://www.chevalblanc.com/en/maison/randheli/

## Written, needs photos or text
- hotel-de-paris-monte-carlo: 0 photos (the image server sends scripts to a login page). Save images from https://www.montecarlosbm.com/en/hotel-monaco/hotel-paris-monte-carlo/ (facade, suites, Le Louis XV, Thermes Marins).
- laucala-island: 2 photos and a 204-word description; the site https://www.laucala.com/ is a video teaser. Needs 3+ more photographs and more facts.

## Held back
- fregate-island-private: written with 6 photos, but the island is closed for a construction programme (bookings "reopen soon"); `closedUntil` keeps it off the site. Remove the field when it reopens.
