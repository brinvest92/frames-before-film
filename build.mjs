// build.mjs - turns content/ + src/ + static/ into the finished site in dist/. No dependencies.
//   node build.mjs
// content/manual.json   the manual's data (cards, levels, looks, lines), written by tools/sync.mjs
// content/media.json    which films, images and files belong to which card, written by tools/sync.mjs
// content/course.mjs    the six lessons and their quizzes
// content/credits.json  sound credits (optional)
// site.config.mjs       name, links, and whether prompts are shown in full
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import cfg from './site.config.mjs';
import { lessons } from './content/course.mjs';

const root = dirname(fileURLToPath(import.meta.url)), dist = join(root, 'dist');
const read = f => readFileSync(join(root, f), 'utf8');
const M = JSON.parse(read('content/manual.json')), MEDIA = JSON.parse(read('content/media.json'));
const CREDITS = existsSync(join(root, 'content/credits.json')) ? JSON.parse(read('content/credits.json')) : { groups: [], attributionRequired: [] };
const F = MEDIA.films, IMG = MEDIA.images, CM = MEDIA.cards;
if (process.env.PROMPT_MODE) cfg.promptMode = process.env.PROMPT_MODE;      // lets a host such as Vercel switch the mode without editing a file

rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, 'assets'), { recursive: true });
cpSync(join(root, 'static'), dist, { recursive: true });
const ver = {};
for (const f of ['styles.css', 'app.js']) { const b = readFileSync(join(root, 'src', f)); ver[f] = createHash('md5').update(b).digest('hex').slice(0, 8); writeFileSync(join(dist, 'assets', f), b); }

/* ------------------------------------------------ helpers ------------------------------------------------ */
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const marks = s => esc(s).replace(/\[[^\]\n]+\]/g, m => `<mark>${m}</mark>`);
const lc = s => s.charAt(0).toLowerCase() + s.slice(1);
const cards = M.cards, byId = Object.fromEntries(cards.map(c => [c.id, c]));
const LV = Object.fromEntries(M.levels.map(l => [l.id, l])), TR = Object.fromEntries(M.trust.map(t => [t.key, t])), CAT = Object.fromEntries(M.categories.map(c => [c.id, c]));
const curl = c => `/library/${(c.id || c).toLowerCase()}/`, lurl = l => `/learn/${l.slug}/`;
const open = c => cfg.promptMode !== 'teaser' || (cfg.freeCards || []).includes(c.id);
const I = {
  play: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>',
  copy: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  search: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  theme: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.2"/><path fill="currentColor" d="M12 3a9 9 0 0 1 0 18z"/></svg>',
  menu: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  down: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  lock: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
};
const badge = s => `<span class="badge ${s}">${esc(TR[s].name)}</span>`;
const shape = m => m.w > m.h * 1.15 ? 'wide' : m.h > m.w * 1.15 ? 'tall' : 'square';
const film = (id, o = {}) => { const f = F[id]; if (!f) return '';
  const attrs = o.auto ? 'muted loop playsinline preload="none" data-auto tabindex="-1"' : `controls playsinline preload="none"${f.loop ? ' loop' : ''}${f.audio ? '' : ' muted'}`;
  const cap = o.caption === false ? '' : `<figcaption><b>${esc(f.title)}</b><span>${Math.round(f.dur)} s${f.audio ? '' : ' · silent'}</span>${f.note && !o.auto ? `<small>${esc(f.note)}</small>` : ''}</figcaption>`;
  return `<figure class="film ${shape(f)}${o.cls ? ' ' + o.cls : ''}"><div class="film-frame"><video ${attrs} poster="${f.poster}" width="${f.w}" height="${f.h}" src="${f.src}"></video></div>${cap}</figure>`; };
const pic = (key, caption = '', group = 'g', cls = '') => { const im = IMG[key]; if (!im) return '';
  return `<a class="pic ${shape(im)} ${cls}" href="${im.src}" data-lb="img" data-group="${group}" data-caption="${esc(caption)}"><img src="${im.src}" width="${im.w}" height="${im.h}" loading="lazy" alt="${esc(caption || 'Example output')}">${caption ? `<span>${esc(caption)}</span>` : ''}</a>`; };
const line = (text, why = '', status = '') => `<div class="line"><div class="line-main"><code>${marks(text)}</code><button class="mini" type="button" data-copy="${esc(text)}">${I.copy} Copy</button></div>${why || status ? `<p class="line-why">${esc(why)} ${status ? badge(status) : ''}</p>` : ''}</div>`;
const secHead = (num, title, kicker = '') => `<header class="sec-head reveal">${num ? `<span class="sec-num">${num}</span>` : ''}<div><h2>${esc(title)}</h2>${kicker ? `<p>${esc(kicker)}</p>` : ''}</div></header>`;
const tile = c => { const m = CM[c.id] || {}, vid = (m.films || []).length > 0;
  return `<a class="tile" style="--c:var(--cat-${c.cat})" href="${curl(c)}" data-cat="${c.cat}" data-level="${c.level.join(' ')}" data-status="${c.status}" data-video="${vid ? 1 : 0}" data-text="${esc((c.id + ' ' + c.title + ' ' + c.when + ' ' + c.output + ' ' + CAT[c.cat].name).toLowerCase())}">
  <div class="tile-thumb">${m.thumb ? `<img src="${m.thumb}" width="480" height="480" loading="lazy" alt="">` : `<span class="tile-ph">${c.id}</span>`}${vid ? `<span class="tile-play">${I.play}</span>` : ''}</div>
  <div class="tile-body"><div class="tile-top"><span class="cid">${c.id}</span>${badge(c.status)}</div><h3>${esc(c.title)}</h3><p>${esc(c.output)}</p><div class="tags">${c.level.map(l => `<span class="tag">${LV[l].tag} ${esc(LV[l].name)}</span>`).join('')}</div></div></a>`; };
const tabs = (id, items, cls = '') => `<div class="tabs ${cls}" data-tabs><div class="tab-list" role="tablist">${items.map((it, i) => `<button role="tab" type="button" aria-selected="${i === 0}" data-tab="${id}-${i}">${it.label}</button>`).join('')}</div>${items.map((it, i) => `<div class="tab-panel" role="tabpanel" data-panel="${id}-${i}"${i ? ' hidden' : ''}>${it.body}</div>`).join('')}</div>`;

/* ------------------------------------------------ page shell ------------------------------------------------ */
const NAV = [['/learn/', 'Learn'], ['/library/', 'Library'], ['/showcase/', 'Showcase'], ['/credits/', 'Credits']];
const hasOg = existsSync(join(root, 'static', 'og.jpg'));
const pages = [];
function page(path, { title, desc, body, cls = '' }) {
  const full = title ? `${title} · ${cfg.name}` : `${cfg.name}: ${cfg.tagline}`, d = desc || cfg.description, abs = cfg.url ? cfg.url + path : '';
  const html = `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(d)}">
<meta property="og:title" content="${esc(full)}"><meta property="og:description" content="${esc(d)}"><meta property="og:type" content="website">${abs ? `<meta property="og:url" content="${abs}"><link rel="canonical" href="${abs}">` : ''}${hasOg && cfg.url ? `<meta property="og:image" content="${cfg.url}/og.jpg"><meta name="twitter:card" content="summary_large_image">` : ''}
<meta name="theme-color" content="#0D0B0A">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/barlow-condensed-latin-800-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/styles.css?v=${ver['styles.css']}">
<script>try{var t=localStorage.getItem('fbf:theme');if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
</head>
<body class="${cls}" data-lessons="${lessons.map(l => l.slug).join(',')}">
<a class="skip" href="#main">Skip to content</a>
<header class="top"><div class="wrap top-in">
  <a class="logo" href="/" aria-label="${esc(cfg.name)}, home"><span class="logo-mark" aria-hidden="true"></span><span>Frames <i>Before</i> Film</span></a>
  <nav class="nav" aria-label="Main">${NAV.map(([h, t]) => `<a href="${h}"${path.startsWith(h) ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
  <div class="top-tools">
    <a class="prog" href="/learn/" title="Your course progress"><svg viewBox="0 0 36 36" width="26" height="26" aria-hidden="true"><circle cx="18" cy="18" r="15" class="prog-bg"/><circle cx="18" cy="18" r="15" class="prog-fg" data-ring/></svg><span data-prog>0/${lessons.length}</span></a>
    <button class="icon-btn" type="button" data-palette-open aria-label="Search (Ctrl K)">${I.search}<kbd>Ctrl K</kbd></button>
    <button class="icon-btn" type="button" data-theme-toggle aria-label="Switch between dark and light">${I.theme}</button>
    <button class="icon-btn menu-btn" type="button" data-menu aria-label="Menu" aria-expanded="false">${I.menu}</button>
  </div>
</div></header>
<main id="main">
${body}
</main>
<footer class="foot"><div class="wrap foot-in">
  <div><a class="logo" href="/"><span class="logo-mark" aria-hidden="true"></span><span>Frames <i>Before</i> Film</span></a><p>${esc(cfg.tagline)}</p></div>
  <nav aria-label="Footer">${NAV.map(([h, t]) => `<a href="${h}">${t}</a>`).join('')}${cfg.buyUrl ? `<a href="${esc(cfg.buyUrl)}">${esc(cfg.buyLabel)}</a>` : ''}</nav>
  <p class="foot-note">${esc(cfg.footerNote)}</p>
</div></footer>
<div class="toast" role="status" aria-live="polite"></div>
<script src="/assets/app.js?v=${ver['app.js']}" defer></script>
</body>
</html>
`;
  const file = join(dist, path, path.endsWith('.html') ? '' : 'index.html'); mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, html); pages.push(path);
}
writeFileSync(join(dist, 'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#151210"/><rect x="12" y="14" width="40" height="8" rx="2" fill="#F6F1E7"/><rect x="12" y="28" width="28" height="8" rx="2" fill="#F6F1E7"/><rect x="12" y="42" width="40" height="8" rx="2" fill="#FF5A1F"/></svg>');

/* ------------------------------------------------ shared blocks ------------------------------------------------ */
const STAGE_COLOR = ['var(--cat-M)', 'var(--cat-G)', 'var(--cat-R)', 'var(--cat-E)'];
const fourFs = id => `<div class="ff" data-tabs><div class="ff-row" role="tablist">${M.stages.map((s, i) => `<button class="ff-btn" role="tab" type="button" aria-selected="${i === 0}" data-tab="${id}-${i}" style="--c:${STAGE_COLOR[i]}"><span>${s.n}</span><b>${s.name}</b><i>${esc(s.gate)}</i></button>`).join('')}</div>
${M.stages.map((s, i) => `<div class="ff-panel" role="tabpanel" data-panel="${id}-${i}"${i ? ' hidden' : ''} style="--c:${STAGE_COLOR[i]}"><dl><div><dt>You do</dt><dd>${esc(s.you)}</dd></div><div><dt>You say</dt><dd><code>${esc(s.say)}</code></dd></div><div><dt>You get</dt><dd>${esc(s.get)}</dd></div><div><dt>The gate</dt><dd class="gate">${esc(s.gate)}</dd></div></dl></div>`).join('')}</div>`;
const threeFilms = id => { const ids = ['aqua-a', 'aqua-b', 'aqua-c'].filter(k => F[k]); if (!ids.length) return '';
  return tabs(id, ids.map(k => ({ label: esc(F[k].title), body: film(k) })), 'films'); };
const compareBlock = () => { const c = MEDIA.compare || []; if (!c.length) return '';
  return `<div class="compare" data-compare style="--pos:50%"><div class="compare-stage"><img class="cmp-after" src="${IMG[c[0].after].src}" width="1280" height="720" alt="The remake"><img class="cmp-before" src="${IMG[c[0].before].src}" width="1280" height="720" alt="The original film"><span class="cmp-tag left">Before</span><span class="cmp-tag right">After</span><span class="cmp-handle" aria-hidden="true"></span><input type="range" min="0" max="100" value="50" aria-label="Drag to compare before and after"></div>
  <div class="compare-pick">${c.map((m, i) => `<button type="button" class="chip" aria-pressed="${i === 0}" data-before="${IMG[m.before].src}" data-after="${IMG[m.after].src}">${esc(m.label)}</button>`).join('')}</div></div>`; };
const wizard = () => `<div class="wizard" data-wizard><p class="wizard-q">I have…</p><div class="wizard-have">${M.routing.map((r, i) => `<button type="button" class="chip" aria-pressed="false" data-row="${i}">${esc(r.have)}</button>`).join('')}</div>
${M.routing.map((r, i) => `<div class="wizard-out" data-out="${i}" hidden><p class="wizard-want">…and I want <b>${esc(lc(r.want))}</b>. Run:</p><div class="grid tiles small">${r.use.filter(u => byId[u]).map(u => tile(byId[u])).join('')}</div></div>`).join('')}<p class="wizard-hint" data-hint>Pick what you are starting from.</p></div>`;
const briefLines = M.brief.split('\n').map(l => { const m = /^([A-Z ]+):\s+\[(.+)\]$/.exec(l.trim()); return m ? { k: m[1], ph: m[2] } : null; }).filter(Boolean);
const briefBuilder = () => `<div class="brief" data-brief><div class="brief-form">${briefLines.map(b => `<label><span>${b.k}</span><input type="text" data-k="${b.k}" placeholder="${esc(b.ph)}" autocomplete="off"></label>`).join('')}</div>
<div class="prompt"><div class="prompt-head"><span class="prompt-label">Your Six-Line Brief</span><button class="mini" type="button" data-brief-reset>Reset</button><button class="mini solid" type="button" data-brief-copy>${I.copy} Copy</button></div><pre class="prompt-body" data-brief-out></pre></div></div>`;
const quizBlock = l => `<section class="quiz" data-quiz aria-label="Check yourself"><h2>Check yourself</h2>${l.quiz.map((q, i) => `<fieldset class="q" data-answer="${q.answer}"><legend><span>${i + 1}</span>${esc(q.q)}</legend>${q.options.map((o, j) => `<button type="button" class="q-opt" data-opt="${j}">${esc(o)}</button>`).join('')}<p class="q-why" hidden>${esc(q.why)}</p></fieldset>`).join('')}</section>`;
const checklist = (key, c) => `<div class="checks-card"><h3>${esc(c.title)}</h3><ul class="checks">${c.items.map((it, i) => `<li><label><input type="checkbox" data-check="${key}-${i}"><span>${esc(it)}</span></label></li>`).join('')}</ul><button class="mini" type="button" data-copy="${esc(c.title + '\n' + c.items.map(i => '[ ] ' + i).join('\n'))}">${I.copy} Copy list</button></div>`;

/* ------------------------------------------------ home ------------------------------------------------ */
const heroFilms = ['karnival', 'aqua-c', 'kartun-c', 'book-b', 'bijak-c'].filter(k => F[k]);
const featured = ['M2', 'M7', 'T2', 'U2', 'G3', 'S1', 'P5', 'E4'].filter(k => byId[k]);
const fullRuns = cards.filter(c => c.sample && c.sample.ran === 'full').length, sampleRuns = cards.filter(c => c.sample).length;
const lessonCards = () => `<ol class="lessons">${lessons.map(l => `<li><a class="lesson-card" href="${lurl(l)}" data-lesson="${l.slug}"><span class="lesson-n">${l.n}</span><div><h3>${esc(l.title)}</h3><p>${esc(l.kicker)}</p></div><span class="lesson-done" aria-hidden="true">${I.check}</span></a></li>`).join('')}</ol>`;
page('/', { cls: 'home', body: `
<section class="hero"><div class="wrap hero-in">
  <div class="hero-copy">
    <p class="eyebrow">A field manual you can play with</p>
    <h1>Frames<br>before<br><em>film</em></h1>
    <p class="lede">Learn to direct videos, ads and graphics with Claude Code, one prompt at a time. Six short lessons, ${cards.length} prompts, and the real output of each one.</p>
    <div class="cta"><a class="btn" href="/learn/">Start the course ${I.arrow}</a><a class="btn ghost" href="/library/">Browse ${cards.length} prompts</a></div>
    <ul class="hero-stats"><li><b>${cards.length}</b> prompt cards</li><li><b>${Object.keys(F).length}</b> films to watch</li><li><b>${sampleRuns}</b> sample runs</li><li><b>${M.styles.length}</b> looks</li></ul>
  </div>
  <div class="hero-reel">${heroFilms.map((k, i) => `<div class="phone p${i}">${film(k, { auto: true, caption: false })}</div>`).join('')}</div>
</div></section>
<div class="tape" aria-hidden="true"><div class="tape-run">${Array(4).fill(M.stages.map(s => `<span>${s.name}</span><i>→</i>`).join('') + '<span class="alt">Facts in, guesses out</span><i>✦</i><span class="alt">Frames before film</span><i>✦</i><span class="alt">Eyes and ears before posting</span><i>✦</i>').join('')}</div></div>

<section class="sec wrap">${secHead('01', 'Every job, four stages', 'Facts, Frames, Film, Files. Each stage ends at a gate with one question, and only you can answer it. Tap a stage.')}
  <div class="reveal">${fourFs('h-ff')}</div></section>

<section class="sec wrap">${secHead('02', 'One brief. Three films.', 'The same one-line brief for an invented water bottle, built three ways. Storyboards let you choose before anything is made.')}
  <div class="split reveal"><div>${threeFilms('h-3')}</div>
  <div class="split-copy"><p class="big">“${esc(M.mission.golden)}”</p><p>At the Storyboarded level you see three options as pictures, with the wording and the timing, and pick one. At Showcase, all three get built.</p><a class="btn ghost" href="${curl('M2')}">See the prompt ${I.arrow}</a></div></div></section>

<section class="sec wrap">${secHead('03', 'Before and after', 'An existing film, diagnosed, storyboarded and rebuilt. Drag the handle.')}
  <div class="reveal">${compareBlock()}</div><p class="after-note reveal"><a class="text-link" href="${curl('R1')}">The three prompts that did this ${I.arrow}</a></p></section>

<section class="sec wrap">${secHead('04', 'Six lessons, about half an hour', 'Short, hands-on, and your progress is saved in this browser.')}
  <div class="reveal">${lessonCards()}</div></section>

<section class="sec wrap">${secHead('05', 'Find your prompt', 'Say what you are starting from. Get the card to run.')}
  <div class="reveal">${wizard()}</div></section>

<section class="sec wrap">${secHead('06', 'From the library', `${cards.length} cards across ${M.categories.length} kinds of work, each with its prompt and what came back.`)}
  <div class="grid tiles reveal">${featured.map(k => tile(byId[k])).join('')}</div>
  <p class="center reveal"><a class="btn" href="/library/">Open the whole library ${I.arrow}</a></p></section>

<section class="rules-band"><div class="wrap"><h2 class="reveal">Three rules to remember first</h2>
  <div class="rules reveal">${M.mission.rules.map(([a, b], i) => `<div class="rule"><span>${i + 1}</span><h3>${esc(a)}</h3><p>${esc(b)}</p></div>`).join('')}</div>
  <p class="center reveal"><a class="btn" href="${lurl(lessons[0])}">Start with lesson 01 ${I.arrow}</a></p></div></section>` });

/* ------------------------------------------------ learn ------------------------------------------------ */
const link = (item, where) => { const L = cfg.links || {};
  const known = { 'Claude Code': L.claudeCode, 'Node.js': L.node, 'WhisperX (needs Python)': L.whisperx, 'The Studio Skill Pack': L.skillPack || cfg.buyUrl, 'A Claude plan with Claude Code usage': L.plan }[item];
  if (known) return `<a href="${esc(known)}" rel="noopener">Get it</a>`;
  if (/^github\.com\//.test(where)) return `<a href="https://${esc(where)}" rel="noopener">${esc(where.replace('github.com/', ''))}</a>`;
  return /PLACEHOLDER/.test(where) ? '' : esc(where); };
const gear = (key, rows) => `<ul class="gear">${rows.map(([item, what, ref, where], i) => `<li><label><input type="checkbox" data-check="${key}-${i}"><span><b>${esc(item)}</b> ${esc(what)}${/PLACEHOLDER/.test(ref) || !ref ? '' : ` <em>${esc(ref)}</em>`}</span></label><span class="gear-link">${link(item, where)}</span></li>`).join('')}</ul>`;
const styleCard = (s, i) => `<article class="look"><div class="look-pics">${s.examples.map(k => pic(k, s.name, 'looks')).join('') || '<span class="look-none">No example yet</span>'}</div><div class="look-body"><h3>${esc(s.name)} ${badge(s.status)}</h3><p>${esc(s.look)} <span>Best for ${esc(lc(s.best))}</span></p><p class="soft">${esc(s.note)}</p><div class="line-main"><code>${marks(s.line)}</code><button class="mini" type="button" data-copy="${esc(s.line)}">${I.copy} Copy</button></div></div></article>`;
const LESSON_BODY = {
  'read-this-first': () => `
  <div class="two"><div><h2>What this solves</h2><p>${esc(M.mission.solves)}</p></div><div><h2>Who it is for</h2><p>${esc(M.mission.who)}</p></div></div>
  <h2>Three rules. Flip each card.</h2>
  <div class="flips">${M.mission.rules.map(([a, b], i) => `<button class="flip" type="button" data-flip aria-pressed="false"><span class="flip-in"><span class="flip-front"><i>${i + 1}</i><b>${esc(a)}</b><small>Tap to flip</small></span><span class="flip-back">${esc(b)}</span></span></button>`).join('')}</div>
  <div class="gold"><span>The golden rule</span><p>${esc(M.mission.golden)}</p></div>
  <h2>Know what you are pasting</h2><p>Every card in the library carries a trust label. It tells you how far its prompt has been taken, so nothing untested is dressed up as proven.</p>
  <div class="trust">${M.trust.map(t => `<a class="trust-row" href="/library/?trust=${t.key}">${badge(t.key)}<span>${esc(t.desc)}</span><b>${t.count}</b></a>`).join('')}</div>
  <h2>Use the library in 60 seconds</h2><ol class="plain">${M.mission.sixty.map(s => `<li>${esc(s.replace('(Section 6)', '(lesson 06)'))}</li>`).join('')}</ol>`,
  'know-the-terrain': () => `
  <h2>The Four F's</h2><p>Every job moves through the same four stages. Tap each one to see what you do, what you say and what comes back.</p>${fourFs('l-ff')}
  <h2>Frames, then film</h2><p>${esc(M.levelFigures.boardToFilm.caption[1])}</p>
  <div class="pairs">${M.levelFigures.boardToFilm.pairs.map(([a, b]) => `<div class="pair">${pic(a, 'The storyboard frame you approve', 'pairs')}<span class="pair-arrow">${I.arrow}</span>${pic(b, 'The same moment in the finished film', 'pairs')}</div>`).join('')}</div>
  <h2>Key terms</h2><input class="filter" type="search" placeholder="Filter the terms" data-filter="#terms" aria-label="Filter the terms">
  <dl class="terms" id="terms">${M.terms.map(([a, b]) => `<div data-item><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join('')}</dl>
  <h2>The tools, in one line each</h2><p>You never name a tool in a prompt. The pack picks them. This is what each one does when you see it in a report.</p>
  <ul class="tools">${M.toolJobs.map(([a, b]) => `<li><b>${esc(a)}</b><span>${esc(b)}</span></li>`).join('')}</ul>`,
  'gear-up': () => `
  <div class="call warn"><span>Before anything else</span><p>The prompts in this course drive the <b>Studio Skill Pack</b>. Without the pack installed in your workspace, <code>/studio</code> and <code>/storyboard</code> do nothing.${cfg.links.skillPack || cfg.buyUrl ? ` <a href="${esc(cfg.links.skillPack || cfg.buyUrl)}">Get the pack</a>.` : ''}</p></div>
  <h2>Required for every job</h2><p>Tick each one off as you install it. Your ticks are saved in this browser.</p>${gear('req', M.prereq.required)}
  <h2>Needed when their job comes up</h2><p>The pack uses these when a card calls for them. They are early releases: when one fails, the pack takes another route and says so in its report.</p>${gear('opt', M.prereq.whenNeeded)}
  <div class="call"><span>Connecting the apps</span><p>${esc(M.prereq.mcp)}</p></div>
  <h2>What you bring</h2><ul class="tools">${M.prereq.you.map(([a, b]) => `<li><b>${esc(a)}</b><span>${esc(b)}</span></li>`).join('')}</ul><p><b>Not needed:</b> ${esc(lc(M.prereq.notNeeded))}</p>
  <h2>Where the work lives</h2><pre class="tree">${marks(M.prereq.tree)}</pre>
  <h2>Check your setup</h2><p>Paste this once after installing. It changes nothing; it reports what is missing.</p>${line(M.prereq.setupCheck)}
  <div class="call ok"><span>First run</span><p>Run card <a href="${curl('M1')}">M1</a> with made-up details. It is the shortest field-tested card and proves the whole chain works, from prompt to finished file.</p></div>`,
  'run-the-play': () => `
  <p>One workflow covers every card. Steps 04 to 06 are skipped at the Quick and Guided levels. Nothing else changes.</p>
  <div class="stepper" data-stepper><div class="stepper-bar"><button class="mini" type="button" data-prev>Back</button><div class="stepper-dots">${M.steps.map((s, i) => `<button type="button" data-go="${i}" aria-label="Step ${s.n}">${s.n}</button>`).join('')}</div><button class="mini solid" type="button" data-next>Next step</button></div>
  ${M.steps.map((s, i) => `<article class="play" data-step="${i}"${i ? ' hidden' : ''}><header><span>${s.n}</span><h3>${esc(s.title)}</h3></header><dl><div><dt>Action</dt><dd>${esc(s.action)}</dd></div><div><dt>Why it matters</dt><dd>${esc(s.why)}</dd></div><div class="tip"><dt>Pro tip</dt><dd>${esc(s.tip)}</dd></div><div class="watch"><dt>Watch out</dt><dd>${esc(s.watch)}</dd></div></dl></article>`).join('')}
  <button class="text-link" type="button" data-all>Show all nine steps</button></div>
  <h2>Build your Six-Line Brief</h2><p>Six lines only you can write. Fill them in, copy the brief, and paste it into the first prompt of any card.</p>${briefBuilder()}`,
  'set-the-dials': () => `
  <h2>Dial 1 · Level</h2><p>A level sets how much you decide and check <em>before</em> the build. The care taken in the build is the same at every level.</p>
  ${tabs('lv', M.levels.map(l => ({ label: `<span>${l.tag}</span> ${esc(l.name)}`, body: `<div class="level"><p class="big">${esc(l.what)}</p><dl><div><dt>Use for</dt><dd>${esc(l.use)}</dd></div><div><dt>You decide</dt><dd>${esc(l.decide)}</dd></div><div><dt>Say</dt><dd><code>${esc(l.say)}</code></dd></div><div><dt>Field-tested on</dt><dd>${esc(l.tested)}</dd></div></dl><a class="text-link" href="/library/?level=${l.id}">Cards at this level ${I.arrow}</a></div>` })), 'levels')}
  <p class="soft">${esc(M.levelNote)}</p>
  <h3>${esc(M.levelFigures.threeFilms.caption[0])} ${esc(M.levelFigures.threeFilms.caption[1].replace(' These are their opening frames.', ''))}</h3>${threeFilms('l-3')}
  <table class="tbl"><thead><tr><th>To move up</th><th>Add this</th><th>Where</th></tr></thead><tbody>${M.shifts.map(([a, b, c]) => `<tr><td>${esc(a)}</td><td><code>${esc(b)}</code></td><td>${esc(c)}</td></tr>`).join('')}</tbody></table>
  <h2>Dial 2 · Look</h2><p>Paste one style line into any prompt. The label shows how far that look has been taken.</p><div class="looks">${M.styles.map(styleCard).join('')}</div>
  <h2>Dial 3 · Delivery pack</h2><p>Say which files you want back. Ask now; asking later costs another pass.</p>${M.packs.map(([n, l]) => line(l, n + ' pack')).join('')}
  <h2>Mix your own</h2><p>Pick a look and a pack. Copy the two lines and add them to any prompt.</p>
  <div class="dial" data-dial><label>Look<select data-dial-look>${M.styles.map(s => `<option value="${esc(s.line)}">${esc(s.name)}</option>`).join('')}</select></label><label>Delivery pack<select data-dial-pack>${M.packs.map(([n, l]) => `<option value="${esc(l)}">${esc(n)}</option>`).join('')}</select></label>
  <div class="prompt"><div class="prompt-head"><span class="prompt-label">Add to your prompt</span><button class="mini solid" type="button" data-dial-copy>${I.copy} Copy</button></div><pre class="prompt-body" data-dial-out></pre></div></div>`,
  'when-x-happens': () => `
  <h2>Find your card</h2>${wizard()}
  <h2>When X happens, do Y</h2><input class="filter" type="search" placeholder="Search the fixes, e.g. voice, loop, licence" data-filter="#trouble" aria-label="Search the fixes">
  <div class="trouble" id="trouble">${M.trouble.map(([x, y, say]) => `<details data-item><summary>${esc(x)}</summary><p>${esc(y)}</p>${say ? `<div class="line-main"><code>${marks(say)}</code><button class="mini" type="button" data-copy="${esc(say)}">${I.copy} Copy</button></div>` : ''}</details>`).join('')}</div>
  <h2>Fix lines</h2><p>Short follow-ups for a board or a finished film. One line, one problem.</p>${M.fixes.map(f => `<h3>${esc(f.stage)}</h3>${f.items.map(i => line(i.prompt, i.when, i.status)).join('')}`).join('')}
  <h2>Add-on lines</h2><p>Each is one sentence that changed a result. Paste any of them into any prompt.</p>${M.addons.map(g => `<details class="group"><summary>${esc(g.group)} <span>${g.items.length}</span></summary>${g.items.map(i => line(i.line, i.why)).join('')}</details>`).join('')}
  <h2>Three checklists</h2><div class="checks-grid">${M.checklists.map((c, i) => checklist('cl' + i, c)).join('')}</div>
  <h2>Control words</h2><table class="tbl"><thead><tr><th>Say</th><th>It does</th></tr></thead><tbody>${M.controlWords.map(([a, b]) => `<tr><td><code>${esc(a)}</code></td><td>${esc(b)}</td></tr>`).join('')}</tbody></table>`,
};
const words = h => h.replace(/<[^>]+>/g, ' ').split(/\s+/).length;
const bodies = Object.fromEntries(lessons.map(l => [l.slug, LESSON_BODY[l.slug]()]));
const mins = l => Math.max(2, Math.round(words(bodies[l.slug]) / 200));
page('/learn/', { title: 'Learn', desc: 'Six short lessons that take you from an empty folder to a posted film.', cls: 'learn', body: `
<section class="page-head"><div class="wrap"><p class="eyebrow">The course</p><h1>Six lessons.<br>One working method.</h1><p class="lede">${esc(M.mission.solves)}</p>
<div class="course-prog"><div class="bar"><i data-bar></i></div><span data-prog-long>0 of ${lessons.length} lessons done</span></div></div></section>
<section class="sec wrap"><ol class="lessons big">${lessons.map(l => `<li><a class="lesson-card" href="${lurl(l)}" data-lesson="${l.slug}"><span class="lesson-n">${l.n}</span><div><h3>${esc(l.title)}</h3><p>${esc(l.kicker)}</p><small>About ${mins(l)} min · ${l.quiz.length} questions</small></div><span class="lesson-done" aria-hidden="true">${I.check}</span></a></li>`).join('')}</ol></section>
<section class="sec wrap">${secHead('', 'What is inside', '')}<ul class="inside">${M.mission.inside.map(i => `<li>${esc(i)}</li>`).join('')}</ul><p><a class="btn" href="${lurl(lessons[0])}">Start lesson 01 ${I.arrow}</a></p></section>` });
lessons.forEach((l, i) => { const prev = lessons[i - 1], next = lessons[i + 1];
  page(lurl(l), { title: `${l.n} ${l.title}`, desc: l.kicker, cls: 'lesson-page', body: `
<section class="page-head"><div class="wrap"><p class="eyebrow"><a href="/learn/">The course</a> · Lesson ${l.n} of ${String(lessons.length).padStart(2, '0')} · about ${mins(l)} min</p><h1><span class="num">${l.n}</span>${esc(l.title)}</h1><p class="lede">${esc(l.kicker)}</p></div></section>
<article class="wrap lesson-body">${bodies[l.slug]}
${quizBlock(l)}
<div class="finish" data-finish="${l.slug}"><button class="btn" type="button" data-complete>${I.check} Mark lesson ${l.n} as done</button><p data-finish-note></p></div>
<nav class="pager" aria-label="Lessons">${prev ? `<a href="${lurl(prev)}"><small>Back</small>${prev.n} ${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a class="next" href="${lurl(next)}"><small>Next lesson</small>${next.n} ${esc(next.title)} ${I.arrow}</a>` : `<a class="next" href="/library/"><small>Course done</small>Open the library ${I.arrow}</a>`}</nav>
</article>` }); });

/* ------------------------------------------------ library ------------------------------------------------ */
page('/library/', { title: 'Prompt library', desc: `${cards.length} prompt cards for motion, graphic, video and ad work, each with the prompt to paste and the output it produced.`, cls: 'library', body: `
<section class="page-head"><div class="wrap"><p class="eyebrow">The prompt library</p><h1>${cards.length} cards.<br>Copy, fill, paste.</h1><p class="lede">Each card says when to use it, gives you the prompt with blanks to fill, and shows what came back.</p></div></section>
<section class="wrap lib" data-library>
  <div class="lib-bar"><div class="lib-search">${I.search}<input type="search" data-q placeholder="Search, e.g. logo, voice, 3D" aria-label="Search the library"></div>
    <div class="chips" data-f="cat">${M.categories.map(c => `<button type="button" class="chip cat" style="--c:var(--cat-${c.id})" aria-pressed="false" data-v="${c.id}">${esc(c.name)}</button>`).join('')}</div>
    <div class="chips" data-f="level">${M.levels.map(l => `<button type="button" class="chip" aria-pressed="false" data-v="${l.id}">${l.tag} ${esc(l.name)}</button>`).join('')}</div>
    <div class="chips" data-f="trust">${M.trust.map(t => `<button type="button" class="chip" aria-pressed="false" data-v="${t.key}">${esc(t.name)}</button>`).join('')}<button type="button" class="chip" aria-pressed="false" data-video>${I.play} With video</button></div>
    <p class="lib-count"><span data-count>${cards.length}</span> of ${cards.length} cards <button class="text-link" type="button" data-clear hidden>Clear filters</button></p></div>
  <div class="grid tiles" data-grid>${cards.map(tile).join('')}</div>
  <p class="empty" data-empty hidden>No card matches. Clear a filter or try another word.</p>
</section>` });

function promptBox(c, s, i) {
  if (!open(c)) return `<div class="prompt locked"><div class="prompt-head"><span class="prompt-label">${esc(s.label)}</span></div><div class="prompt-body">${marks(s.prompt.slice(0, 150).replace(/\s+\S*$/, ''))}…</div><div class="lock">${I.lock}<span>The full prompt is in the manual.</span>${cfg.buyUrl ? `<a class="btn" href="${esc(cfg.buyUrl)}">${esc(cfg.buyLabel)}</a>` : ''}</div></div>`;
  let k = 0; const body = esc(s.prompt).replace(/\[[^\]\n]+\]/g, m => `<span class="tok" contenteditable="true" role="textbox" aria-label="${m.slice(1, -1)}" spellcheck="false" data-ph="${m}" data-i="${k++}"></span>`);
  return `<div class="prompt" data-prompt="${c.id}-${i}"><div class="prompt-head"><span class="prompt-label">${esc(s.label)}</span>${k ? '<span class="prompt-left" data-left></span><button class="mini" type="button" data-reset>Reset</button>' : ''}<button class="mini solid" type="button" data-copy-prompt>${I.copy} Copy</button></div><div class="prompt-body" data-body>${body}</div><div class="picks" data-picks hidden></div></div>`;
}
const PRIMARY = { 'kartun-a': 'S1', 'kartun-b': 'S1', 'kartun-c': 'S1', routine: 'S2', karnival: 'M1', 'book-a': 'M4' };
cards.forEach((c, idx) => { const m = CM[c.id] || { films: [], images: [], files: [] }, ex = c.example, prev = cards[idx - 1], next = cards[idx + 1];
  const media = [
    m.films.length > 1 ? tabs('f', m.films.map(k => ({ label: esc(F[k].title), body: film(k) })), 'films') : m.films.length ? film(m.films[0]) : '',
    m.compare ? compareBlock() : '',
    m.demo ? `<div class="demo"><iframe src="${m.demo.href}" title="Live demo" loading="lazy"></iframe><a class="btn ghost" href="${m.demo.href}" target="_blank" rel="noopener">${esc(m.demo.label)} ${I.arrow}</a></div>` : '',
    m.images.length ? `<div class="gallery n${Math.min(m.images.length, 6)}">${m.images.map(im => pic(im.key, im.caption, c.id)).join('')}</div>` : '',
  ].filter(Boolean).join('');
  const facts = ex ? [['Brief used', ex.brief], ['Delivered', ex.delivered], ['Not built in this run', ex.notBuilt], ['Made with', c.sample && c.sample.tools], ['Weakest part', c.sample && c.sample.weakest]].filter(f => f[1]) : [];
  page(curl(c), { title: `${c.id} ${c.title}`, desc: `${c.when} ${c.get}`, cls: 'card-page', body: `
<section class="page-head card-head" style="--c:var(--cat-${c.cat})"><div class="wrap"><p class="eyebrow"><a href="/library/">Library</a> · <a href="/library/?cat=${c.cat}">${esc(CAT[c.cat].name)}</a></p>
  <h1><span class="cid big">${c.id}</span>${esc(c.title)}</h1>
  <div class="card-meta">${badge(c.status)}${c.level.map(l => `<a class="tag" href="/library/?level=${l}">${LV[l].tag} ${esc(LV[l].name)}</a>`).join('')}<span class="tag plain">Starts from: ${esc(lc(M.sources[c.source]))}</span><span class="tag plain">Result: ${esc(lc(c.output))}</span></div></div></section>
<div class="wrap card-body ${m.films.length && m.films.every(k => shape(F[k]) === 'tall') && !m.images.length && !m.compare && !m.demo ? 'side' : 'stack'}">
  ${media ? `<section class="card-media"><h2>${ex ? esc(ex.label) : 'Output'}</h2>${ex ? `<p class="soft">${esc(ex.note)}</p>` : ''}${media}${m.files.length ? `<div class="files">${m.files.map(f => `<a class="file" href="${f.href}" download>${I.down}<span>${esc(f.label)}</span><small>${(f.bytes / 1048576).toFixed(1)} MB</small></a>`).join('')}</div>` : ''}</section>` : ''}
  <section class="card-main">
    <div class="when"><p><b>Use it when</b> ${esc(lc(c.when))}</p><p><b>You get</b> ${esc(lc(c.get))}</p></div>
    <h2>The prompt${c.steps.length > 1 ? 's, in order' : ''}</h2>${open(c) ? '<p class="soft">Click a yellow blank and type. Your answers stay in this browser. Copy when it reads right, then paste it into Claude Code in your workspace.</p>' : ''}
    ${c.steps.map((s, i) => promptBox(c, s, i)).join('')}
    ${c.limits ? `<div class="call warn"><span>Limits</span><p>${esc(c.limits)}</p></div>` : ''}
    ${c.tips.length ? `<h2>Tips</h2><ul class="tips">${c.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
    ${facts.length ? `<h2>About this ${c.sample ? 'sample run' : 'example'}</h2><dl class="facts">${facts.map(([a, b]) => `<div><dt>${a}</dt><dd>${esc(b)}</dd></div>`).join('')}</dl>` : ''}
    ${c.tested ? `<p class="soft">Field-tested on: ${esc(c.tested)}</p>` : ''}
  </section>
  <nav class="pager" aria-label="Cards">${prev ? `<a href="${curl(prev)}"><small>Previous card</small>${prev.id} ${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a class="next" href="${curl(next)}"><small>Next card</small>${next.id} ${esc(next.title)} ${I.arrow}</a>` : '<span></span>'}</nav>
</div>` }); });

/* ------------------------------------------------ showcase ------------------------------------------------ */
const filmCard = {}; for (const c of cards) for (const k of (CM[c.id] || {}).films || []) if (!filmCard[k]) filmCard[k] = c.id; Object.assign(filmCard, PRIMARY);
const shots = [];
for (const [k, f] of Object.entries(F)) { const c = byId[filmCard[k]]; if (!c) continue; shots.push({ kind: f.loop ? 'loop' : 'film', html: `<a class="shot ${shape(f)}" href="${f.src}" data-lb="video" data-group="show" data-poster="${f.poster}" data-caption="${esc(f.title)}" data-link="${curl(c)}" data-linktext="${c.id} · ${esc(c.title)}" data-hover="${f.src}" data-kind="${f.loop ? 'loop' : 'film'}"><img src="${f.poster}" width="${f.w}" height="${f.h}" loading="lazy" alt="${esc(f.title)}"><span class="shot-play">${I.play}</span><span class="shot-cap"><b>${c.id}</b> ${esc(f.title)}</span></a>` }); }
for (const c of cards) { const m = CM[c.id] || {}; if ((m.films || []).length) continue; for (const im of (m.images || []).slice(0, 3)) { const g = IMG[im.key]; const kind = g.src.endsWith('.gif') ? 'loop' : 'still';
  shots.push({ kind, html: `<a class="shot ${shape(g)}" href="${g.src}" data-lb="img" data-group="show" data-caption="${esc(im.caption)}" data-link="${curl(c)}" data-linktext="${c.id} · ${esc(c.title)}" data-kind="${kind}"><img src="${g.src}" width="${g.w}" height="${g.h}" loading="lazy" alt="${esc(im.caption)}"><span class="shot-cap"><b>${c.id}</b> ${esc(im.caption || c.title)}</span></a>` }); } }
const mixed = []; { const by = { film: shots.filter(s => s.kind === 'film'), still: shots.filter(s => s.kind === 'still'), loop: shots.filter(s => s.kind === 'loop') }; while (by.film.length || by.still.length || by.loop.length) for (const k of ['film', 'still', 'film', 'loop', 'still']) if (by[k].length) mixed.push(by[k].shift()); }
const demos = cards.filter(c => (CM[c.id] || {}).demo);
page('/showcase/', { title: 'Showcase', desc: 'Every film, still, loop and live demo made with the prompts in the library.', cls: 'showcase', body: `
<section class="page-head"><div class="wrap"><p class="eyebrow">The showcase</p><h1>${Object.keys(F).length} films.<br>All made by prompt.</h1><p class="lede">Hover to preview, click to watch with sound. Every piece links to the card and the prompt that made it.</p>
<div class="chips" data-show-filter><button type="button" class="chip" aria-pressed="true" data-v="">Everything</button><button type="button" class="chip" aria-pressed="false" data-v="film">Films</button><button type="button" class="chip" aria-pressed="false" data-v="still">Stills</button><button type="button" class="chip" aria-pressed="false" data-v="loop">Loops and stickers</button></div></div></section>
<section class="wrap"><div class="wall" data-wall>${mixed.map(s => s.html).join('')}</div></section>
${demos.length ? `<section class="sec wrap">${secHead('', 'Live demos', 'Real pages you can open and use.')}<div class="grid tiles small">${demos.map(c => tile(c)).join('')}</div></section>` : ''}` });

/* ------------------------------------------------ credits, 404 ------------------------------------------------ */
page('/credits/', { title: 'Credits and licences', desc: 'Sound, music, fonts and tools behind the examples.', cls: 'credits', body: `
<section class="page-head"><div class="wrap"><p class="eyebrow">Credits</p><h1>Who made the sounds,<br>and what is invented</h1><p class="lede">${esc(cfg.footerNote)}</p></div></section>
<article class="wrap lesson-body">
<h2>How the examples were made</h2><p>${esc(M.sampleLine)}</p><ul class="tips">${M.limits.map(l => `<li>${esc(l)}</li>`).join('')}</ul>
<h2>Sound and music</h2><p>Some films are shown without their music, or without sound, because the tune came from a catalogue that gives no licence text. Those films say so under the player.</p>
${(CREDITS.attributionRequired || []).length ? `<div class="call warn"><span>Attribution</span><p>${CREDITS.attributionRequired.map(a => `${esc(a.text)} (${esc(a.film)})`).join('<br>')}</p></div>` : ''}
${(CREDITS.groups || []).map(g => `<h3>${esc(g.film)}</h3>${g.note ? `<p class="soft">${esc(g.note)}</p>` : ''}<table class="tbl"><thead><tr><th>Use</th><th>Sound</th><th>By</th><th>Licence</th></tr></thead><tbody>${g.items.map(i => `<tr><td>${esc(i.use)}</td><td>${i.url ? `<a href="${esc(i.url)}" rel="noopener">${esc(i.title)}</a>` : esc(i.title)}${i.source ? `<small>${esc(i.source)}</small>` : ''}</td><td>${esc(i.creator)}</td><td>${esc(i.licence)}</td></tr>`).join('')}</tbody></table>`).join('') || '<p class="soft">The sound credits list is being compiled.</p>'}
<h2>Fonts on this site</h2><p>Barlow Condensed, Inter and JetBrains Mono, each under the SIL Open Font License 1.1. The licence files are in the site's <code>/fonts/</code> folder.</p>
<h2>Tools</h2><ul class="tools">${M.toolJobs.map(([a, b]) => `<li><b>${esc(a)}</b><span>${esc(b)}</span></li>`).join('')}</ul>
</article>` });
page('/404.html', { title: 'Not found', body: `<section class="page-head"><div class="wrap"><p class="eyebrow">404</p><h1>That frame<br>is not in the film.</h1><p class="lede">The page you asked for does not exist.</p><div class="cta"><a class="btn" href="/">Go home</a><a class="btn ghost" href="/library/">Open the library</a></div></div></section>` });

/* ------------------------------------------------ search index, sitemap ------------------------------------------------ */
const index = [...lessons.map(l => ({ t: `Lesson ${l.n} · ${l.title}`, d: l.kicker, u: lurl(l), k: 'Lesson' })), ...cards.map(c => ({ t: `${c.id} · ${c.title}`, d: c.when, u: curl(c), k: CAT[c.cat].name })),
  { t: 'Prompt library', d: 'All cards, with filters', u: '/library/', k: 'Page' }, { t: 'Showcase', d: 'Every film and still', u: '/showcase/', k: 'Page' }, { t: 'Credits and licences', d: 'Sound, fonts, tools', u: '/credits/', k: 'Page' },
  ...M.trouble.map(([x]) => ({ t: x, d: 'Fix · lesson 06', u: lurl(lessons[5]) + '#trouble', k: 'Fix' }))];
writeFileSync(join(dist, 'assets', 'search.json'), JSON.stringify(index));
if (cfg.url) { writeFileSync(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.filter(p => !p.includes('404')).map(p => `<url><loc>${cfg.url}${p}</loc></url>`).join('\n')}\n</urlset>\n`); writeFileSync(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${cfg.url}/sitemap.xml\n`); }
console.log(`built ${pages.length} pages into dist/ (${cards.length} cards, ${lessons.length} lessons, ${Object.keys(F).length} films, prompts: ${cfg.promptMode})`);
