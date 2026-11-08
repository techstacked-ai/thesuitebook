// Cloudflare setup for thesuitebook.com, run by .github/workflows/cloudflare_setup.yml
// (and deploy.yml for the project step). Mirrors the Roam network's
// scripts/deploy/cloudflare/setup.mjs for one site. Every step is idempotent.
//
//   node scripts/cloudflare_setup.mjs project|zone|dns|domains|pagesdns|markdown|bots|activate|status|all
//
//   markdown  Accept: text/markdown gets the page's index.md (a URL rewrite and two response header rules)
//   bots      prints the zone's bot settings (AI bot blocking, AI Labyrinth, managed robots.txt, Bot Fight Mode),
//             then turns them off so AI crawlers and assistants are welcome; `bots check` only prints

const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID;
const PROJECT = 'thesuitebook';
const DOMAIN = 'thesuitebook.com';
// Search Console Domain property verification (31 Oct 2026). Public by nature: it sits in DNS.
const GOOGLE_TXT = ''; // Search Console Domain property token, once the owner adds the site
const step = process.argv[2] || 'status';

if (!TOKEN || !ACCOUNT) {
  console.log('::notice::No CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID; nothing done.');
  process.exit(0);
}

async function api(method, path, body) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/${path}`, {
    method,
    headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!json.success) {
    const err = new Error(`${method} ${path}: ${res.status} ${JSON.stringify(json.errors || json)}`);
    err.status = res.status;
    throw err;
  }
  return json.result;
}

async function getZone() {
  const list = await api('GET', `zones?name=${DOMAIN}&account.id=${ACCOUNT}`);
  return list[0] || null;
}

const steps = {
  async project() {
    try {
      await api('GET', `accounts/${ACCOUNT}/pages/projects/${PROJECT}`);
      console.log(`project ${PROJECT}: exists`);
    } catch (e) {
      if (e.status !== 404) throw e;
      await api('POST', `accounts/${ACCOUNT}/pages/projects`, { name: PROJECT, production_branch: 'main' });
      console.log(`project ${PROJECT}: created`);
    }
  },

  async zone() {
    let z = await getZone();
    if (!z) {
      z = await api('POST', 'zones', { name: DOMAIN, account: { id: ACCOUNT }, type: 'full' });
      console.log(`zone ${DOMAIN}: created`);
    }
    console.log(`zone ${DOMAIN}: ${z.status}, nameservers ${(z.name_servers || []).join(' ')}`);
  },

  async dns() {
    const z = await getZone();
    if (!z) throw new Error('no zone yet, run the zone step first');
    const recs = await api('GET', `zones/${z.id}/dns_records?type=TXT&name=${DOMAIN}`);
    if (!GOOGLE_TXT) { console.log('no Search Console token yet'); } else if (recs.some((r) => r.content.replace(/"/g, '') === GOOGLE_TXT)) {
      console.log('TXT google-site-verification: exists');
    } else {
      await api('POST', `zones/${z.id}/dns_records`, { type: 'TXT', name: DOMAIN, content: GOOGLE_TXT, ttl: 300 });
      console.log('TXT google-site-verification: added');
    }
  },

  async domains() {
    const have = await api('GET', `accounts/${ACCOUNT}/pages/projects/${PROJECT}/domains`);
    for (const name of [DOMAIN, `www.${DOMAIN}`]) {
      const d = have.find((x) => x.name === name);
      if (d) {
        console.log(`domain ${name}: ${d.status}`);
        continue;
      }
      const r = await api('POST', `accounts/${ACCOUNT}/pages/projects/${PROJECT}/domains`, { name });
      console.log(`domain ${name}: added, ${r.status}`);
    }
  },

  async pagesdns() {
    const z = await getZone();
    if (!z) throw new Error('no zone yet, run the zone step first');
    for (const name of [DOMAIN, `www.${DOMAIN}`]) {
      const recs = await api('GET', `zones/${z.id}/dns_records?name=${name}`);
      const existing = recs.find((r) => r.type === 'CNAME' || r.type === 'A' || r.type === 'AAAA');
      const want = { type: 'CNAME', name, content: `${PROJECT}.pages.dev`, proxied: true, ttl: 1 };
      if (existing && existing.type === 'CNAME' && existing.content === want.content && existing.proxied) {
        console.log(`${name}: CNAME ok`);
      } else if (existing) {
        await api('PUT', `zones/${z.id}/dns_records/${existing.id}`, want);
        console.log(`${name}: CNAME updated`);
      } else {
        await api('POST', `zones/${z.id}/dns_records`, want);
        console.log(`${name}: CNAME added`);
      }
    }
  },

  async activate() {
    const z = await getZone();
    if (!z) throw new Error('no zone yet');
    if (z.status !== 'active') {
      await api('PUT', `zones/${z.id}/activation_check`).catch((e) => console.log('activation check:', e.message));
    }
    const d = await api('GET', `accounts/${ACCOUNT}/pages/projects/${PROJECT}/domains`);
    for (const x of d) {
      if (x.status !== 'active') {
        await api('PATCH', `accounts/${ACCOUNT}/pages/projects/${PROJECT}/domains/${x.name}`).catch((e) =>
          console.log(`retry ${x.name}:`, e.message),
        );
      }
    }
    await steps.status();
  },

  // Markdown for agents, as on the Roam sites (GoTokyo scripts/deploy/cloudflare/setup.mjs, step markdown): a page
  // request that asks for text/markdown is rewritten to <page>/index.md (scripts/markdown/build.mjs writes it at
  // deploy); the answer carries Content-Type text/markdown, and every page varies on Accept so no cache serves one
  // for the other. Needs Zone > Transform Rules > Edit on the token.
  async markdown() {
    const z = await getZone();
    if (!z) { console.log('markdown: no zone'); return; }
    const ask = 'any(http.request.headers["accept"][*] contains "text/markdown")';
    const page = 'ends_with(http.request.uri.path, "/")';
    await api('PUT', `zones/${z.id}/rulesets/phases/http_request_transform/entrypoint`, { rules: [{
      description: 'Markdown for agents: page/ to page/index.md',
      expression: `(${ask} and ${page})`,
      action: 'rewrite',
      action_parameters: { uri: { path: { expression: 'concat(http.request.uri.path, "index.md")' } } },
    }] });
    console.log('markdown: rewrite rule set');
    await api('PUT', `zones/${z.id}/rulesets/phases/http_response_headers_transform/entrypoint`, { rules: [
      { description: 'Markdown for agents: content type', expression: `(${ask} and ends_with(http.request.uri.path, "/index.md") and http.response.code eq 200)`, action: 'rewrite',
        action_parameters: { headers: { 'content-type': { operation: 'set', value: 'text/markdown; charset=utf-8' }, vary: { operation: 'set', value: 'Accept, Accept-Encoding' } } } },
      { description: 'Pages vary on Accept (HTML or Markdown)', expression: `(not ${ask} and ends_with(http.request.uri.path, "/"))`, action: 'rewrite',
        action_parameters: { headers: { vary: { operation: 'set', value: 'Accept, Accept-Encoding' } } } },
    ] });
    console.log('markdown: header rules set');
  },

  // AI crawlers welcome, as on the Roam sites: Cloudflare's "Block AI bots", AI Labyrinth, its managed robots.txt
  // (which would add Disallow lines for AI crawlers) and Bot Fight Mode off. `bots check` prints and changes nothing.
  async bots() {
    const z = await getZone();
    if (!z) { console.log('bots: no zone'); return; }
    const before = await api('GET', `zones/${z.id}/bot_management`);
    console.log(`bots: now ${JSON.stringify(before)}`);
    if (process.argv[3] === 'check') return;
    const after = await api('PUT', `zones/${z.id}/bot_management`, { fight_mode: false, enable_js: false, ai_bots_protection: 'disabled', crawler_protection: 'disabled', is_robots_txt_managed: false });
    console.log(`bots: after ${JSON.stringify(after)}`);
  },

  async status() {
    const z = await getZone();
    console.log(`zone: ${z ? `${z.status}, nameservers ${(z.name_servers || []).join(' ')}` : 'none'}`);
    try {
      const d = await api('GET', `accounts/${ACCOUNT}/pages/projects/${PROJECT}/domains`);
      for (const x of d) console.log(`domain ${x.name}: ${x.status}`);
    } catch (e) {
      console.log('domains:', e.message);
    }
    try {
      const p = await api('GET', `accounts/${ACCOUNT}/pages/projects/${PROJECT}`);
      console.log(`project: ${p.subdomain}, latest deploy ${p.latest_deployment?.url || 'none'}`);
    } catch (e) {
      console.log('project:', e.message);
    }
  },

  async all() {
    for (const s of ['project', 'zone', 'dns', 'domains', 'pagesdns', 'status']) {
      console.log(`\n# ${s}`);
      await steps[s]();
    }
  },
};

if (!steps[step]) {
  console.error(`unknown step "${step}"`);
  process.exit(1);
}
await steps[step]();
