# The Suite Book, project notes

The goal (owner, 8 Nov 2026): the hundred most luxurious hotels in the world, one quiet, photograph-first page each, every fact from the hotel's own pages, and a booking button through Stay22. "This one really needs to look the part. Elegant." Domain thesuitebook.com. Separate brand and repo from the Roam network, The New Grand and The All-In Guide (whose engine this one is adapted from). The look: planning/design-brief.md. The hundred: planning/candidates.json (pick=true) and planning/picks.md.

## Rules
- Facts from the hotel's or its operator's own pages only (hotel site, brand site, press room, fact sheet), each with sourceUrl and lastVerified. Never OTAs, review sites, aggregators, blogs or other directories or "best hotels" lists. Missing means empty, never guessed. Schema: docs/data-model.md. Voice: docs/voice.md. Research agents follow docs/research-brief.md.
- Photos: only the hotel's own press or website images, through scripts/photos/import.mjs, credited. No stock, no third-party photos, no identifiable person as the main subject. A hotel with fewer than five photos is not published.
- Money: Stay22 only. LetMeAllez in src/layouts/Base.astro (lmaID 6a29ef1adf1132ff50147172, in the setup line only, never as an aid=). Booking links use aid=roamcitymaps (bookUrl in src/lib/hotels.ts), rel="sponsored nofollow noopener". Order: the exact Booking.com listing (stay22Id), else Expedia through Allez by the hotel's address, else "Reserve with the hotel" on officialSite (no affiliate). The footer carries the disclosure. No other programmes, no display ads without the owner. Analytics: none until the owner chooses (GoatCounter only, never Google Analytics).
- Writing: no em dashes, no first person, no hype words, no exclamation marks. Understated, specific (docs/voice.md).
- Design: Bodoni Moda (display) and Inter Tight (small text), self-hosted in public/fonts. White, ink #121212, midnight #1c2733, hairlines #e4e2dd. No gold, no cream, no gradients, no badges on photos. One slow fade on the home hero, nothing else moves. Tokens in src/layouts/Base.astro, scoped styles, no inline styles, trailing-slash URLs.
- Subagents on Sonnet, each with its own scratch folder; never run another agent's script. Research agents write data/hotels/<slug>.json and public/photos/<slug>/ only, and never `git add -A` over data/ or public/photos/.
- Before committing data: `node scripts/check_data.mjs` (0 errors) and `npx astro build`.
- Commits end with the session's attribution lines (Co-Authored-By and Claude-Session) given in the conversation.

## Deploying
Cloudflare Pages project thesuitebook via .github/workflows/deploy.yml on every push to main (build, Markdown copies, link check, wrangler, IndexNow). .github/workflows/cloudflare_setup.yml runs scripts/cloudflare_setup.mjs (project, zone, dns, domains, pagesdns, markdown, bots, activate, status). Both need the repo secrets CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID, the same values as GoTokyo's.

## Key files
- STATUS.md, docs/data-model.md, docs/voice.md, docs/research-brief.md, planning/
- data/hotels/<slug>.json, src/lib/hotels.ts (loading, publishing rule, bookUrl), src/layouts/Base.astro
