# Hotels for a browser session (8 Nov 2026, updated 9 Nov)

These sites refused every request from the cloud research agents (403, Cloudflare, Akamai, Vercel or Incapsula challenges, or a blocked host). Research them from a session on the owner's computer, in the owner's own Chrome (Claude in Chrome), following docs/research-brief.md: facts from the hotel's or operator's own pages, 5 to 8 of the hotel's own photographs through scripts/photos/import.mjs (save images to a scratch folder and use `--file` with `--url` set to the page or image address), `node scripts/check_data.mjs --slug <slug>` at 0 errors. Never solve a captcha; if a page shows one, skip it and note it here. Coordinates, website guesses and Stay22 ids for most of these are in planning/candidates.json.

## Done in a browser session, 9 Nov 2026 (built-in browser of the Claude desktop app)
Written with 8 or 9 photos each: le-bristol-paris, hotel-du-cap-eden-roc, hotel-plaza-athenee, the-dorchester, the-beverly-hills-hotel, hotel-bel-air, cheval-blanc-paris, cheval-blanc-courchevel, cheval-blanc-st-barth-isle-de-france, cheval-blanc-randheli, ritz-paris, bulgari-resort-dubai, the-pierre, taj-lake-palace, umaid-bhawan-palace, rambagh-palace, the-peninsula-hong-kong, capella-singapore, passalacqua, villa-feltrinelli, badrutts-palace-hotel, the-retreat-at-blue-lagoon-iceland, sandy-lane, necker-island, six-senses-zighy-bay. hotel-de-paris-monte-carlo now has 7 photos, laucala-island 8.

Routes: oetkerhotels.com, dorchestercollection.com, chevalblanc.com, ritzparis.com, tajhotels.com, peninsula.com, capellahotels.com and bulgarihotels.com all open in the built-in browser with no challenge; same-origin fetch() reads the other pages. Images import with plain curl from images.eu.ctfassets.net (Oetker, ?w=2800), dorchestercollection.com/media (max 1920), images.prismic.io (Cheval Blanc), media.ritzparis.com, cdn.sanity.io (Taj), capellahotels.com. Peninsula and Bulgari images refuse curl: fetch them in the tab and save through an <a download> link (the desktop app saves them as hidden dot-files in ~/Downloads), then import with --file. montecarlosbm.com originals redirect to a login page; its styled derivatives with their own token work. Necker's working host is virginlimitededition.com.

## Still open
- Al Maha, a Luxury Collection Desert Resort & Spa: marriott.com was blocking this machine (Akamai) on 8 and 9 Nov. Retry later.
- Tawaraya Ryokan, Kyoto: kyoto-tawaraya.jp does not resolve from this machine (DNS, curl and the browser all fail).
- laucala-island: description still 204 words; laucala.com publishes too little to reach 300 without padding.
- hotel-du-cap-eden-roc: seasonal, open 18 Apr to 17 Oct 2027. It is published; add closedUntil if the owner wants it off the site while closed.

## Held back
- fregate-island-private: written with 6 photos, but the island is closed for a construction programme (bookings "reopen soon"); `closedUntil` keeps it off the site. Remove the field when it reopens.
