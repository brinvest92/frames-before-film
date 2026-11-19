/* Frames Before Film - site behaviour. Plain JavaScript, no libraries. Everything a visitor types or ticks is kept
   in their own browser (localStorage, keys starting "fbf:") and is never sent anywhere. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = { get(k, d) { try { const v = localStorage.getItem('fbf:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem('fbf:' + k, JSON.stringify(v)); } catch (e) { /* private window */ } } };
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const html = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const pressed = el => el.getAttribute('aria-pressed') === 'true';

  /* ---------- toast and copy ---------- */
  const toastEl = $('.toast'); let toastT;
  function toast(msg) { if (!toastEl) return; toastEl.textContent = msg; toastEl.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), 2200); }
  async function copy(text, msg = 'Copied') { try { await navigator.clipboard.writeText(text); } catch (e) { const a = document.createElement('textarea'); a.value = text; a.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); } toast(msg); }
  document.addEventListener('click', e => { const b = e.target.closest('[data-copy]'); if (b) copy(b.dataset.copy); });

  /* ---------- theme, menu ---------- */
  $$('[data-theme-toggle]').forEach(b => b.addEventListener('click', () => { const t = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'; document.documentElement.dataset.theme = t; try { localStorage.setItem('fbf:theme', t); } catch (e) { /* ignore */ } }));
  $$('[data-menu]').forEach(b => b.addEventListener('click', () => b.setAttribute('aria-expanded', document.body.classList.toggle('nav-open'))));

  /* ---------- reveal on scroll, autoplaying previews ---------- */
  if ('IntersectionObserver' in window && !calm) { const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' }); $$('.reveal').forEach(el => io.observe(el)); }
  else $$('.reveal').forEach(el => el.classList.add('in'));
  const autos = $$('video[data-auto]');
  if (calm) autos.forEach(v => { v.controls = true; });
  else if ('IntersectionObserver' in window) { const vo = new IntersectionObserver(es => es.forEach(e => { const v = e.target; if (e.isIntersecting && v.offsetParent !== null) { v.muted = true; const p = v.play(); if (p) p.catch(() => {}); } else v.pause(); }), { threshold: 0.35 }); autos.forEach(v => vo.observe(v)); }

  /* ---------- tabs ---------- */
  $$('[data-tabs]').forEach(box => { const own = sel => $$(sel, box).filter(el => el.closest('[data-tabs]') === box), tabs = own('[data-tab]'), panels = own('[data-panel]');
    tabs.forEach(t => t.addEventListener('click', () => { tabs.forEach(x => x.setAttribute('aria-selected', x === t)); panels.forEach(p => { const on = p.dataset.panel === t.dataset.tab; p.hidden = !on; if (!on) $$('video', p).forEach(v => v.pause()); }); })); });

  /* ---------- before / after ---------- */
  $$('[data-compare]').forEach(box => { const range = $('input[type=range]', box), set = () => box.style.setProperty('--pos', range.value + '%'); range.addEventListener('input', set); set();
    const picks = $$('[data-before]', box); picks.forEach(b => b.addEventListener('click', () => { picks.forEach(x => x.setAttribute('aria-pressed', x === b)); $('.cmp-before', box).src = b.dataset.before; $('.cmp-after', box).src = b.dataset.after; })); });

  /* ---------- prompts with blanks to fill ---------- */
  $$('[data-prompt]').forEach(box => {
    const id = box.dataset.prompt, body = $('[data-body]', box), toks = $$('.tok', body), left = $('[data-left]', box), picks = $('[data-picks]', box), saved = store.get('p:' + id, []);
    toks.forEach((t, i) => { if (saved[i]) t.textContent = saved[i]; });
    const val = t => t.textContent.replace(/ /g, ' ').trim();
    const text = () => [...body.childNodes].map(n => n.nodeType === 3 ? n.nodeValue : n.classList && n.classList.contains('tok') ? (val(n) || n.dataset.ph) : n.textContent).join('');
    const update = () => { const n = toks.filter(t => !val(t)).length; toks.forEach(t => t.classList.toggle('filled', !!val(t))); if (left) { left.textContent = n ? n + (n === 1 ? ' blank left' : ' blanks left') : 'Ready to paste'; left.classList.toggle('ready', !n); } };
    const save = () => { store.set('p:' + id, toks.map(val)); update(); };
    function showPicks(t) { if (!picks) return; const ph = t.dataset.ph.slice(1, -1), opts = ph.includes(' / ') && !/e\.g\.|,|\b(PATH|THE|MY|THIS|YOUR|ANY|A|OR)\b/.test(ph) ? ph.split(' / ').map(s => s.trim()) : [];
      if (opts.length < 2 || opts.length > 5 || opts.some(o => o.length > 26)) { picks.hidden = true; return; }
      const nice = o => /\d/.test(o) ? o : o.toLowerCase();
      picks.innerHTML = '<span>Quick picks</span>' + opts.map(o => `<button type="button" class="chip">${html(nice(o))}</button>`).join(''); picks.hidden = false;
      $$('button', picks).forEach((b, i) => b.addEventListener('mousedown', e => { e.preventDefault(); t.textContent = nice(opts[i]); save(); })); }
    toks.forEach((t, i) => {
      t.addEventListener('input', () => { if (!val(t)) t.textContent = ''; save(); });
      t.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); (toks[i + 1] || t).focus(); } });
      t.addEventListener('paste', e => { e.preventDefault(); document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text').replace(/\s+/g, ' ')); });
      t.addEventListener('focus', () => showPicks(t));
    });
    box.addEventListener('click', e => { if (e.target.closest('[data-copy-prompt]')) copy(text(), toks.some(t => !val(t)) ? 'Copied, with blanks still to fill' : 'Copied. Paste it into Claude Code');
      if (e.target.closest('[data-reset]')) { toks.forEach(t => { t.textContent = ''; }); save(); if (picks) picks.hidden = true; } });
    update();
  });

  /* ---------- Six-Line Brief, dial mixer ---------- */
  $$('[data-brief]').forEach(box => { const inputs = $$('input[data-k]', box), out = $('[data-brief-out]', box), saved = store.get('brief', {});
    inputs.forEach(i => { i.value = saved[i.dataset.k] || ''; });
    const text = () => inputs.map(i => (i.dataset.k + ':').padEnd(9) + (i.value.trim() || '[' + i.placeholder + ']')).join('\n');
    const paint = () => { out.textContent = text(); store.set('brief', Object.fromEntries(inputs.map(i => [i.dataset.k, i.value]))); };
    inputs.forEach(i => i.addEventListener('input', paint)); paint();
    $('[data-brief-copy]', box).addEventListener('click', () => copy(text(), 'Brief copied'));
    $('[data-brief-reset]', box).addEventListener('click', () => { inputs.forEach(i => { i.value = ''; }); paint(); }); });
  $$('[data-dial]').forEach(box => { const look = $('[data-dial-look]', box), pack = $('[data-dial-pack]', box), out = $('[data-dial-out]', box), paint = () => { out.textContent = look.value + '\n' + pack.value; };
    look.addEventListener('change', paint); pack.addEventListener('change', paint); paint(); $('[data-dial-copy]', box).addEventListener('click', () => copy(out.textContent, 'Two lines copied')); });

  /* ---------- stepper, flip cards, ticks, filters, wizard ---------- */
  $$('[data-stepper]').forEach(box => { const steps = $$('[data-step]', box), dots = $$('[data-go]', box), prev = $('[data-prev]', box), next = $('[data-next]', box); let at = 0; const seen = new Set([0]);
    const go = i => { at = Math.max(0, Math.min(steps.length - 1, i)); seen.add(at); steps.forEach((s, k) => { s.hidden = k !== at; }); dots.forEach((d, k) => { d.classList.toggle('on', k === at); d.classList.toggle('seen', seen.has(k)); }); prev.disabled = at === 0; next.disabled = at === steps.length - 1; };
    prev.addEventListener('click', () => go(at - 1)); next.addEventListener('click', () => go(at + 1)); dots.forEach((d, k) => d.addEventListener('click', () => go(k)));
    const all = $('[data-all]', box); all.addEventListener('click', () => { const on = box.classList.toggle('all'); all.textContent = on ? 'Show one step at a time' : 'Show all nine steps'; if (!on) go(at); });
    box.addEventListener('keydown', e => { if (e.key === 'ArrowRight') go(at + 1); if (e.key === 'ArrowLeft') go(at - 1); }); go(0); });
  $$('[data-flip]').forEach(b => b.addEventListener('click', () => b.setAttribute('aria-pressed', !pressed(b))));
  const ticks = store.get('checks', {});
  $$('input[data-check]').forEach(c => { c.checked = !!ticks[c.dataset.check]; c.addEventListener('change', () => { ticks[c.dataset.check] = c.checked; store.set('checks', ticks); }); });
  $$('input[data-filter]').forEach(inp => { const items = $$(inp.dataset.filter + ' [data-item]'); inp.addEventListener('input', () => { const q = inp.value.trim().toLowerCase(); items.forEach(it => { it.hidden = !!q && !it.textContent.toLowerCase().includes(q); }); }); });
  $$('[data-wizard]').forEach(box => { const rows = $$('[data-row]', box), outs = $$('[data-out]', box), hint = $('[data-hint]', box);
    rows.forEach(r => r.addEventListener('click', () => { rows.forEach(x => x.setAttribute('aria-pressed', x === r)); outs.forEach(o => { o.hidden = o.dataset.out !== r.dataset.row; }); if (hint) hint.hidden = true; })); });

  /* ---------- course progress, quiz, confetti ---------- */
  const lessons = (document.body.dataset.lessons || '').split(',').filter(Boolean);
  const done = () => store.get('done', []).filter(s => lessons.includes(s));
  function paintProgress() { const d = done(), n = lessons.length || 1;
    $$('[data-prog]').forEach(e => { e.textContent = d.length + '/' + lessons.length; }); $$('[data-ring]').forEach(c => c.setAttribute('stroke-dasharray', (94.25 * d.length / n).toFixed(1) + ' 95'));
    $$('[data-bar]').forEach(b => { b.style.width = (100 * d.length / n) + '%'; }); $$('[data-prog-long]').forEach(e => { e.textContent = d.length === lessons.length ? 'Course complete' : d.length + ' of ' + lessons.length + ' lessons done'; });
    $$('[data-lesson]').forEach(a => a.classList.toggle('is-done', d.includes(a.dataset.lesson)));
    $$('[data-finish]').forEach(f => { const on = d.includes(f.dataset.finish); f.classList.toggle('done', on); const note = $('[data-finish-note]', f); if (note) note.textContent = on ? (d.length === lessons.length ? 'All six lessons done. The library is yours.' : 'Done. ' + (lessons.length - d.length) + ' to go.') : 'Your progress is saved in this browser.'; }); }
  function confetti(count = 120) { if (calm) return; const c = document.createElement('canvas'); c.className = 'confetti'; document.body.appendChild(c); const x = c.getContext('2d'), W = c.width = innerWidth, H = c.height = innerHeight, cols = ['#FF5A1F', '#FFD84D', '#19C3A6', '#A78BFF', '#FF6FA8', '#4DA3FF', '#F6F1E7'];
    const ps = Array.from({ length: count }, () => ({ x: W / 2 + (Math.random() - .5) * W * .3, y: H * .6, vx: (Math.random() - .5) * 15, vy: -Math.random() * 17 - 5, s: 5 + Math.random() * 8, r: Math.random() * 6, c: cols[Math.random() * cols.length | 0] })); let t = 0;
    (function tick() { x.clearRect(0, 0, W, H); ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .45; p.r += .2; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * .66); x.restore(); }); if (++t < 110) requestAnimationFrame(tick); else c.remove(); })(); }
  $$('[data-finish]').forEach(f => $('[data-complete]', f).addEventListener('click', () => { const slug = f.dataset.finish, d = store.get('done', []), i = d.indexOf(slug);
    if (i >= 0) d.splice(i, 1); else { d.push(slug); const all = lessons.every(s => d.includes(s)); confetti(all ? 260 : 110); toast(all ? 'Course complete' : 'Lesson done'); } store.set('done', d); paintProgress(); }));
  $$('[data-quiz]').forEach(quiz => $$('.q', quiz).forEach(q => { const opts = $$('.q-opt', q), why = $('.q-why', q);
    opts.forEach(o => o.addEventListener('click', () => { if (o.dataset.opt === q.dataset.answer) { o.classList.add('right'); opts.forEach(x => { x.disabled = true; x.classList.remove('wrong'); }); why.hidden = false; if ($$('.q', quiz).every(k => $('.right', k))) toast('All correct'); } else { o.classList.remove('wrong'); void o.offsetWidth; o.classList.add('wrong'); } })); }));
  paintProgress();

  /* ---------- library filters (kept in the address bar so a filtered view can be shared) ---------- */
  const lib = $('[data-library]');
  if (lib) { const tiles = $$('.tile', lib), q = $('[data-q]', lib), count = $('[data-count]', lib), empty = $('[data-empty]', lib), clear = $('[data-clear]', lib), vid = $('[data-video]', lib);
    const groups = Object.fromEntries($$('[data-f]', lib).map(g => [g.dataset.f, $$('.chip[data-v]', g)])), on = k => groups[k].filter(pressed).map(c => c.dataset.v);
    function apply(push = true) { const s = { q: q.value.trim().toLowerCase(), cat: on('cat'), level: on('level'), trust: on('trust'), video: pressed(vid) }; let n = 0;
      tiles.forEach(t => { const ok = (!s.cat.length || s.cat.includes(t.dataset.cat)) && (!s.level.length || s.level.some(l => t.dataset.level.split(' ').includes(l))) && (!s.trust.length || s.trust.includes(t.dataset.status)) && (!s.video || t.dataset.video === '1') && (!s.q || t.dataset.text.includes(s.q)); t.hidden = !ok; if (ok) n++; });
      count.textContent = n; empty.hidden = n > 0; clear.hidden = !(s.q || s.cat.length || s.level.length || s.trust.length || s.video);
      if (push) { const p = new URLSearchParams(); if (s.q) p.set('q', s.q); ['cat', 'level', 'trust'].forEach(k => { if (s[k].length) p.set(k, s[k].join(',')); }); if (s.video) p.set('video', '1'); history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : '')); } }
    const p = new URLSearchParams(location.search); q.value = p.get('q') || '';
    ['cat', 'level', 'trust'].forEach(k => (p.get(k) || '').split(',').forEach(v => { const c = groups[k].find(x => x.dataset.v === v); if (c) c.setAttribute('aria-pressed', 'true'); })); if (p.get('video')) vid.setAttribute('aria-pressed', 'true');
    lib.addEventListener('click', e => { const c = e.target.closest('.lib-bar .chip'); if (c) { c.setAttribute('aria-pressed', !pressed(c)); apply(); } if (e.target.closest('[data-clear]')) { q.value = ''; $$('.lib-bar .chip', lib).forEach(x => x.setAttribute('aria-pressed', 'false')); apply(); } });
    q.addEventListener('input', () => apply()); apply(false); }

  /* ---------- showcase: filter, and a silent preview on hover ---------- */
  $$('[data-show-filter]').forEach(bar => { const chips = $$('.chip', bar), shots = $$('[data-wall] .shot');
    chips.forEach(c => c.addEventListener('click', () => { chips.forEach(x => x.setAttribute('aria-pressed', x === c)); shots.forEach(s => { s.hidden = !!c.dataset.v && s.dataset.kind !== c.dataset.v; }); })); });
  if (matchMedia('(hover: hover)').matches && !calm) $$('.shot[data-hover]').forEach(s => { let v;
    s.addEventListener('pointerenter', () => { if (v) return; v = document.createElement('video'); v.src = s.dataset.hover; v.muted = true; v.loop = true; v.playsInline = true; s.insertBefore(v, s.children[1]); const p = v.play(); if (p) p.catch(() => {}); });
    s.addEventListener('pointerleave', () => { if (v) { v.remove(); v = null; } }); });

  /* ---------- lightbox ---------- */
  let lb, items = [], at = 0;
  function lbShow() { const a = items[at], src = a.getAttribute('href'), m = $('.lb-media', lb);
    m.innerHTML = a.dataset.lb === 'video' ? `<video src="${html(src)}" poster="${html(a.dataset.poster || '')}" controls autoplay playsinline></video>` : `<img src="${html(src)}" alt="${html(a.dataset.caption || '')}">`;
    $('.lb-cap', lb).innerHTML = `<span>${html(a.dataset.caption || '')}</span>` + (a.dataset.link ? `<a href="${html(a.dataset.link)}">${html(a.dataset.linktext || 'See the prompt')} →</a>` : '') + (items.length > 1 ? `<span>${at + 1} / ${items.length}</span>` : '');
    $('.lb-prev', lb).hidden = $('.lb-next', lb).hidden = items.length < 2; }
  function lbClose() { if (!lb) return; lb.remove(); lb = null; document.body.style.overflow = ''; }
  function lbMove(d) { at = (at + d + items.length) % items.length; lbShow(); }
  document.addEventListener('click', e => { const a = e.target.closest('a[data-lb]'); if (!a || e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault();
    items = $$(`a[data-lb][data-group="${a.dataset.group}"]`).filter(x => x === a || (!x.hidden && x.offsetParent !== null)); at = Math.max(0, items.indexOf(a));
    lb = document.createElement('div'); lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-label', 'Viewer');
    lb.innerHTML = '<div class="lb-media"></div><div class="lb-cap"></div><button class="lb-close" type="button" aria-label="Close">×</button><button class="lb-prev" type="button" aria-label="Previous">‹</button><button class="lb-next" type="button" aria-label="Next">›</button>';
    document.body.appendChild(lb); document.body.style.overflow = 'hidden'; lbShow(); $('.lb-close', lb).focus();
    lb.addEventListener('click', ev => { if (ev.target === lb || ev.target.closest('.lb-close')) lbClose(); else if (ev.target.closest('.lb-prev')) lbMove(-1); else if (ev.target.closest('.lb-next')) lbMove(1); }); });

  /* ---------- search palette (Ctrl K) ---------- */
  let pal, data, sel = 0, shown = [];
  function palRender(q) { const words = q.toLowerCase().split(/\s+/).filter(Boolean), list = $('.pal-list', pal);
    shown = (data || []).filter(it => { const hay = (it.t + ' ' + it.d + ' ' + it.k).toLowerCase(); return words.every(w => hay.includes(w)); }).slice(0, 14); sel = 0;
    list.innerHTML = shown.length ? shown.map((it, i) => `<a class="pal-item${i ? '' : ' on'}" href="${html(it.u)}"><b>${html(it.t)}</b><small>${html(it.d)}</small><em>${html(it.k)}</em></a>`).join('') : `<p class="pal-none">${data ? 'Nothing matches.' : 'Loading…'}</p>`; }
  async function palOpen() { if (pal) return; pal = document.createElement('div'); pal.className = 'pal'; pal.setAttribute('role', 'dialog'); pal.setAttribute('aria-label', 'Search');
    pal.innerHTML = '<div class="pal-in"><input type="search" placeholder="Search lessons, cards and fixes" aria-label="Search"><div class="pal-list"></div></div>'; document.body.appendChild(pal);
    const inp = $('input', pal); inp.focus(); palRender(''); inp.addEventListener('input', () => palRender(inp.value));
    pal.addEventListener('click', e => { if (e.target === pal) palClose(); });
    inp.addEventListener('keydown', e => { const its = $$('.pal-item', pal); if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!its.length) return; its[sel].classList.remove('on'); sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + its.length) % its.length; its[sel].classList.add('on'); its[sel].scrollIntoView({ block: 'nearest' }); } if (e.key === 'Enter' && shown[sel]) location.href = shown[sel].u; });
    if (!data) { try { data = await (await fetch('/assets/search.json')).json(); } catch (e) { data = []; } if (pal) palRender(inp.value); } }
  function palClose() { if (pal) { pal.remove(); pal = null; } }
  $$('[data-palette-open]').forEach(b => b.addEventListener('click', palOpen));
  document.addEventListener('keydown', e => { const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); pal ? palClose() : palOpen(); }
    else if (e.key === '/' && !typing) { e.preventDefault(); const q = $('[data-q]'); q ? q.focus() : palOpen(); }
    else if (e.key === 'Escape') { palClose(); lbClose(); }
    else if (lb && e.key === 'ArrowRight') lbMove(1); else if (lb && e.key === 'ArrowLeft') lbMove(-1); });
})();
