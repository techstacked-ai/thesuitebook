# Brief for every research agent

Read docs/data-model.md and docs/voice.md first. Then, for each hotel in your list (planning/candidates.json, the entries with pick=true):

1. Find the hotel's own website and its operator's pages (rooms and suites, dining, spa, fact sheet, press room, media library). Read them any honest way that works: curl, WebFetch, a headless browser, the sitemap, RSS, a PDF, the page's embedded JSON, a CDN copy of the operator's own file, or a retry later. A refusal from one client or one path is not the end: try the others. The limits: never solve a captcha or get past a bot-verification challenge, never pretend to be someone else (no fake browser or crawler identity, no borrowed accounts), keep a sane pace, and never send any personal name or email address to any service or form.
2. Write data/hotels/<slug>.json with every field the pages support. Leave the rest empty. Carry over `stay22Id`, `rating` and `price` from candidates.json only when its Stay22 match is the right hotel.
3. Import five to ten photographs with scripts/photos/import.mjs, looking at each first (download to your scratch folder, open with the Read tool). The first is the wide lead image, 2000px or wider if the hotel offers one. No people as the main subject, no logos or menus, no renders of a hotel already open.
4. Run `node scripts/check_data.mjs --slug <slug>` until it shows 0 errors.

Your scratch folder is the one named in your task. Use no other folder, run no script you did not write in this run except scripts/photos/import.mjs and scripts/check_data.mjs, touch only your own hotels' files. Commit only your own files by path (`git add data/hotels/<slug>.json public/photos/<slug>`), never `git add -A`, and `git pull --rebase origin main` before pushing, if your task says to push. Report, per hotel: what was written, the photo count, what the hotel does not publish. Then the routes that worked or refused per operator.
