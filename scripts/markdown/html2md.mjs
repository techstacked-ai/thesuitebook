// HTML page to Markdown for AI agents, ported from the Roam network (GoTokyo
// scripts/markdown/html2md.mjs). scripts/markdown/build.mjs writes
// <page>/index.md next to every built page from this converter; each page links
// it with <link rel="alternate" type="text/markdown">, and a Cloudflare rule
// (scripts/cloudflare_setup.mjs markdown) serves it to requests that send
// Accept: text/markdown. Reads the page's <main> only (no navigation, footer,
// map canvas or scripts), keeps headings, paragraphs, lists, links, tables and
// alt text. On top: title, URL, description and the page's last-updated date
// (<meta name="last-modified">, set by src/layouts/Base.astro).
import { parse } from 'parse5';

const SKIP = new Set(['script', 'style', 'noscript', 'template', 'svg', 'canvas', 'iframe', 'video', 'audio', 'form', 'button', 'select', 'input', 'textarea', 'nav', 'dialog']);
const BLOCK = new Set(['p', 'div', 'section', 'article', 'header', 'footer', 'aside', 'figure', 'figcaption', 'main', 'ul', 'ol', 'li', 'table', 'tr', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'dl', 'dt', 'dd', 'details', 'summary', 'address', 'hr', 'pre', 'time']);

const attr = (n, k) => n.attrs?.find(a => a.name === k)?.value;
const hidden = n => attr(n, 'hidden') !== undefined || attr(n, 'aria-hidden') === 'true' || /(^|\s)(sr-skip|visually-hidden-skip)(\s|$)/.test(attr(n, 'class') || '');

function find(n, test) {
  if (test(n)) return n;
  for (const c of n.childNodes || []) { const r = find(c, test); if (r) return r; }
  if (n.content) return find(n.content, test);
  return null;
}
function findAll(n, test, out = []) {
  if (test(n)) out.push(n);
  for (const c of n.childNodes || []) findAll(c, test, out);
  return out;
}
const text = n => n.nodeName === '#text' ? n.value : (n.childNodes || []).map(text).join('');
const squash = s => s.replace(/[ \t\r\n ]+/g, ' ');
const escInline = s => s.replace(/([\\`*_[\]])/g, '\\$1');

/** An absolute link for a site-relative href. */
function absolute(href, origin) {
  if (!href || href.startsWith('#') || /^javascript:/i.test(href)) return '';
  try { return new URL(href, origin).toString(); } catch { return ''; }
}

/** Inline content of a node as Markdown (links, emphasis, code, line breaks). */
function inline(n, ctx) {
  if (n.nodeName === '#text') return escInline(squash(n.value));
  if (n.nodeName === '#comment' || SKIP.has(n.nodeName) || hidden(n)) return '';
  const kids = () => (n.childNodes || []).map(c => inline(c, ctx)).join('');
  switch (n.nodeName) {
    case 'br': return '  \n';
    case 'strong': case 'b': { const t = kids().trim(); return t ? `**${t}**` : ''; }
    case 'em': case 'i': { const t = kids().trim(); return t ? `*${t}*` : ''; }
    case 'code': { const t = squash(text(n)).trim(); return t ? `\`${t.replace(/`/g, '')}\`` : ''; }
    case 'img': { const alt = squash(attr(n, 'alt') || '').trim(); return alt ? `[Image: ${escInline(alt)}]` : ''; }
    case 'a': {
      const t = kids().trim();
      const href = absolute(attr(n, 'href'), ctx.origin);
      if (!t) return '';
      return href ? `[${t}](${href})` : t;
    }
    // Spans often sit side by side as label and value ("Cost" "Free"): keep a space between them.
    case 'span': case 'small': case 'dfn': { const t = kids(); return t.trim() ? ` ${t} ` : t; }
    default: return kids();
  }
}

/** Block content as Markdown lines. */
function blocks(n, ctx, out, depth = 0) {
  if (n.nodeName === '#text') { const t = escInline(squash(n.value)); if (t.trim()) ctx.para += t; return; }
  if (n.nodeName === '#comment' || SKIP.has(n.nodeName) || hidden(n)) return;
  const tag = n.nodeName;
  const flush = () => { const t = ctx.para.trim(); if (t) out.push(t, ''); ctx.para = ''; };
  if (!BLOCK.has(tag)) { ctx.para += inline(n, ctx); return; }
  flush();
  if (/^h[1-6]$/.test(tag)) {
    const t = inline(n, ctx).trim();
    if (t) out.push(`${'#'.repeat(Number(tag[1]))} ${t}`, '');
    return;
  }
  if (tag === 'hr') { out.push('---', ''); return; }
  if (tag === 'pre') { out.push('```', text(n).replace(/\n+$/, ''), '```', ''); return; }
  if (tag === 'ul' || tag === 'ol') {
    let i = 1;
    for (const li of (n.childNodes || []).filter(c => c.nodeName === 'li' && !hidden(c))) {
      const sub = [];
      const inner = { origin: ctx.origin, para: '' };
      for (const c of li.childNodes || []) blocks(c, inner, sub, depth + 1);
      if (inner.para.trim()) sub.push(inner.para.trim());
      const lines = sub.filter((l, k) => l !== '' || (k > 0 && sub[k - 1] !== ''));
      const first = lines.findIndex(l => l.trim());
      if (first < 0) continue;
      const bullet = tag === 'ol' ? `${i++}. ` : '- ';
      const pad = '  '.repeat(depth);
      out.push(pad + bullet + lines[first]);
      for (const l of lines.slice(first + 1)) if (l.trim()) out.push(pad + '  ' + l);
    }
    out.push('');
    return;
  }
  if (tag === 'table') {
    const rows = findAll(n, x => x.nodeName === 'tr').map(tr => (tr.childNodes || []).filter(c => c.nodeName === 'td' || c.nodeName === 'th').map(c => inline(c, ctx).trim().replace(/\|/g, '\\|') || ' '));
    if (rows.length) {
      const w = Math.max(...rows.map(r => r.length));
      const fix = r => [...r, ...Array(w - r.length).fill(' ')];
      out.push(`| ${fix(rows[0]).join(' | ')} |`, `| ${Array(w).fill('---').join(' | ')} |`, ...rows.slice(1).map(r => `| ${fix(r).join(' | ')} |`), '');
    }
    return;
  }
  if (tag === 'blockquote') {
    const sub = [];
    const inner = { origin: ctx.origin, para: '' };
    for (const c of n.childNodes || []) blocks(c, inner, sub, depth);
    if (inner.para.trim()) sub.push(inner.para.trim());
    for (const l of sub) out.push(l ? `> ${l}` : '>');
    out.push('');
    return;
  }
  if (tag === 'dt') { const t = inline(n, ctx).trim(); if (t) out.push(`**${t}**`); return; }
  if (tag === 'dd') { const t = inline(n, ctx).trim(); if (t) out.push(t, ''); return; }
  for (const c of n.childNodes || []) blocks(c, ctx, out, depth);
  flush();
}

/** Markdown for one built page (null only for a document with no body). `url` is the page's URL. */
export function htmlToMarkdown(html, url) {
  const doc = parse(html);
  const head = find(doc, n => n.nodeName === 'head');
  const meta = name => attr(find(head || doc, n => n.nodeName === 'meta' && attr(n, 'name') === name) || {}, 'content');
  // Every page gets one, noindex pages too: the Cloudflare rule rewrites any
  // page request that asks for Markdown, so a missing file would be a 404.
  const main = find(doc, n => n.nodeName === 'main') || find(doc, n => n.nodeName === 'body');
  if (!main) return null;
  const titleNode = find(head || doc, n => n.nodeName === 'title');
  const title = titleNode ? squash(text(titleNode)).trim() : '';
  const canonical = attr(find(head || doc, n => n.nodeName === 'link' && attr(n, 'rel') === 'canonical') || {}, 'href') || url;
  const ctx = { origin: canonical, para: '' };
  const out = [];
  blocks(main, ctx, out);
  if (ctx.para.trim()) out.push(ctx.para.trim());
  const body = out.join('\n').replace(/[ \t]+([,.;:!?)])/g, '$1').replace(/\( +/g, '(').replace(/[ \t]{2,}(?!\n)/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  const description = meta('description');
  const updated = meta('last-modified');
  const lines = [];
  if (title && !/^# /m.test(body)) lines.push(`# ${title}`, '');
  else if (title) lines.push(`Title: ${title}`);
  lines.push(`URL: ${canonical}`);
  if (updated) lines.push(`Last updated: ${updated}`);
  if (description) lines.push('', `> ${squash(description).trim()}`);
  lines.push('', body, '');
  return lines.join('\n');
}
