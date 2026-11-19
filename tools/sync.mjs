// sync.mjs - pulls content and media from the studio workspace into this repo.
//   node tools/sync.mjs            (run on the machine that has the workspace; needs ffmpeg and ffprobe on PATH)
// Reads  <workspace>/playbook/dist/manual-data.json  and the finished files under <workspace>/projects/.
// Writes content/manual.json, content/media.json and everything under static/media/, static/demos/.
// Videos are re-encoded small for the web and stripped of metadata. It is safe to run again: files that are
// newer than their source are kept. The deployed site never runs this; it only reads what this wrote.
import { spawnSync } from 'node:child_process';
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WS = resolve(process.env.STUDIO_WORKSPACE || join(root, '..'));
const PROJ = join(WS, 'projects'), SAMP = join(PROJ, '2026-11-19-playbook-samples'), PRO = join(WS, 'playbook', 'pro', 'assets');
const OUT = join(root, 'static'), V = join(OUT, 'media', 'video'), PO = join(OUT, 'media', 'poster'), IM = join(OUT, 'media', 'img'), FI = join(OUT, 'media', 'files');
const TH = join(OUT, 'media', 'thumb');
for (const d of [V, PO, IM, FI, TH, join(OUT, 'demos'), join(root, 'content')]) mkdirSync(d, { recursive: true });

const run = (cmd, args) => { const r = spawnSync(cmd, args, { encoding: 'utf8' }); if (r.status) console.log(`  ! ${cmd} failed: ${(r.stderr || '').trim().split('\n').slice(-2).join(' | ')}`); return r; };
const ff = args => run('ffmpeg', ['-v', 'error', '-y', ...args]);
const probe = file => { const j = JSON.parse(run('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,width,height:format=duration', '-of', 'json', file]).stdout || '{}'); const v = (j.streams || []).find(s => s.codec_type === 'video') || {};
  return { w: v.width || 0, h: v.height || 0, dur: +(+(j.format || {}).duration || 0).toFixed(2), audio: (j.streams || []).some(s => s.codec_type === 'audio') }; };
const fresh = (dst, src) => existsSync(dst) && (!src || !existsSync(src) || statSync(dst).mtimeMs >= statSync(src).mtimeMs);
const SHORT720 = "scale='if(gt(iw,ih),-2,720)':'if(gt(iw,ih),720,-2)':flags=lanczos";
const X264 = ['-c:v', 'libx264', '-preset', 'slow', '-crf', '25', '-tune', 'animation', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-r', '30', '-movflags', '+faststart', '-map_metadata', '-1'];
const AAC = ['-c:a', 'aac', '-b:a', '112k', '-ac', '2'];

/* ------------------------------------------------ films ------------------------------------------------ */
// mute: the sound is not published (its music came from a catalogue that gives no licence text).
const NO_MUSIC = 'Shown without its music: the tune came from a catalogue that gives no licence text.';
const NO_SOUND = 'Shown without sound: its music came from a catalogue that gives no licence text.';
const P = (...a) => join(PROJ, ...a), S = (...a) => join(SAMP, ...a);
const FILMS = {
  karnival: { src: P('2026-11-18-karnival-sains-2027/out/karnival-sains-2027-v1.mp4'), title: 'Event announcement', poster: 12.7 },
  'aqua-a': { src: P('2026-11-18-aquaku-launch/out/aquaku-launch-a-v1-effects-only.mp4'), title: 'Film A · a day and a night', poster: 5.8, note: NO_MUSIC },
  'aqua-b': { src: P('2026-11-18-aquaku-launch/out/aquaku-launch-b-v1.mp4'), title: 'Film B · type only', poster: 4.05 },
  'aqua-c': { src: P('2026-11-18-aquaku-launch/out/aquaku-launch-c-v1.mp4'), title: 'Film C · 3D', poster: 7.5 },
  'bijak-a': { src: P('2026-11-18-bijak-kira-kelas-online/out/bijak-kira-kelas-online-a-v1.mp4'), title: 'Film A · drawn characters', poster: 12.3, mute: true, note: NO_SOUND },
  'bijak-b': { src: P('2026-11-18-bijak-kira-kelas-online/out/bijak-kira-kelas-online-b-v1.mp4'), title: 'Film B · whiteboard marker', poster: 10, mute: true, note: NO_SOUND },
  'bijak-c': { src: P('2026-11-18-bijak-kira-kelas-online/out/bijak-kira-kelas-online-c-v1.mp4'), title: 'Film C · 3D numbers', poster: 5.4, mute: true, note: NO_SOUND },
  'kartun-c': { src: P('2026-11-18-cerita-kartun-30-saat/out/cerita-kartun-30-saat-v1.mp4'), title: 'Film C · the shadow', poster: 8.1 },
  'kartun-a': { src: P('2026-11-18-cerita-kartun-30-saat/out/cerita-kartun-30-saat-a-v1.mp4'), title: 'Film A · the ant and the cracker', poster: 21.9, mute: true, note: NO_SOUND },
  'kartun-b': { src: P('2026-11-18-cerita-kartun-30-saat/out/cerita-kartun-30-saat-b-v1-tanpa-lagu.mp4'), title: 'Film B · the zero', poster: 21.9, note: NO_MUSIC },
  reel: { src: P('2026-11-18-jom-baca-10-minit/out/jom-baca-10-minit-reel-v1.mp4'), title: 'The poster, animated', poster: 9.6 },
  'intro-wide': { src: P('2026-11-18-cikgu-sains-intro/out/cikgu-sains-intro-v1.mp4'), title: 'Channel intro · 16:9', poster: 4.6 },
  'intro-tall': { src: P('2026-11-18-cikgu-sains-intro/out/cikgu-sains-intro-v1-9x16.mp4'), title: 'Channel intro · 9:16', poster: 4.6 },
  // highlights only: the parts of the 150-second film that show no child's name
  routine: { src: P('2026-11-18-menjelang-maghrib/out/menjelang-maghrib-v2-sound-1920x1080.mp4'), title: 'Routine film · highlights', poster: 34, cuts: [[0, 16], [28, 50], [96, 104], [108, 124], [134, 140]], note: 'A 68-second cut of a 150-second film.' },
  'book-b': { src: P('2026-11-18-affliate-buku/out/latihan-asas-sains-b-v1.mp4'), title: 'Film B · a drawn experiment', poster: 8.6 },
  'book-c': { src: P('2026-11-18-affliate-buku/out/latihan-asas-sains-c-v1.mp4'), title: 'Film C · a pen-drawn quiz', poster: 12.4 },
  'book-a': { src: P('2026-11-18-affliate-buku/out/latihan-asas-sains-a-v1.mp4'), title: 'Film A · footage with overlays', poster: 8.9 },
  'hook-question': { src: S('M11-hook-test/out/karnival-sains-2027-hook-soalan-v1.mp4'), title: 'Hook 1 · a question', poster: 0.8 },
  'hook-free': { src: S('M11-hook-test/out/karnival-sains-2027-hook-percuma-v1.mp4'), title: 'Hook 2 · the free offer', poster: 0.8 },
  'hook-rocket': { src: S('M11-hook-test/out/karnival-sains-2027-hook-tunggu-v1.mp4'), title: 'Hook 3 · the rocket speaks', poster: 0.8 },
  'karnival-en': { src: S('R5-karnival-sains-english/out/science-carnival-2027-en-v1.mp4'), title: 'The English version', poster: 12.7 },
  'showreel-wide': { src: S('P3-showreel/out/studio-sample-reel-2026-16x9-v1.mp4'), title: 'Showreel · 16:9', poster: 3 },
  'showreel-tall': { src: S('P3-showreel/out/studio-sample-reel-2026-9x16-v1.mp4'), title: 'Showreel · 9:16', poster: 21.2 },
  'stage-loop': { src: S('T3-awards-night-loops/out/awards-night-loop-1-ribbon-wave-8bars-v1.mp4'), title: 'Stage loop · Ribbon Wave', poster: 3, loop: true },
  'logo-anim': { src: S('P5-little-sprout-brand-kit/out/animation/little-sprout-logo-animation-v1.mp4'), title: 'Logo animation', poster: 2.8 },
  'micro-1': { src: S('U2-micro-interactions/out/booknest-micro-1-borrow-press-v1.mp4'), title: 'Borrow button', poster: 1.2, loop: true },
  'micro-2': { src: S('U2-micro-interactions/out/booknest-micro-2-spinner-v1.mp4'), title: 'Loading spinner', poster: 1, loop: true },
  'micro-3': { src: S('U2-micro-interactions/out/booknest-micro-3-success-tick-v1.mp4'), title: 'Success tick', poster: 1.6, loop: true },
  'micro-4': { src: S('U2-micro-interactions/out/booknest-micro-4-list-to-detail-v1.mp4'), title: 'List to detail', poster: 2, loop: true },
  // transparent clips, shown here laid over a plain plate (the delivered files have a real alpha channel)
  'overlay-lower-third': { src: S('T2-science-fair-live/out/science-fair-live-lower-third-mira-tan-v1.webm'), title: 'Lower third', poster: 3, alpha: true, loop: true },
  'overlay-topic': { src: S('T2-science-fair-live/out/science-fair-live-topic-bar-v1.webm'), title: 'Topic bar', poster: 3, alpha: true, loop: true },
  'overlay-score': { src: S('T2-science-fair-live/out/science-fair-live-scoreboard-v1.webm'), title: 'Scoreboard', poster: 4, alpha: true, loop: true },
  'overlay-wipe': { src: S('T2-science-fair-live/out/science-fair-live-wipe-v1.webm'), title: 'Transition wipe', poster: 0.75, alpha: true, loop: true },
};
const PLATE = "color=c=black:s=1280x720:r=30,format=rgb24,geq=r='122+54*Y/H':g='136+52*Y/H':b='164+46*Y/H'";
const films = {};
for (const [id, f] of Object.entries(FILMS)) {
  if (!existsSync(f.src)) { console.log('  ! missing film source for', id); continue; }
  const dst = join(V, id + '.mp4'), pst = join(PO, id + '.jpg'), a = f.mute ? ['-an'] : AAC;
  if (!fresh(dst, f.src)) {
    if (f.alpha) { const d = probe(f.src).dur || 8; ff(['-f', 'lavfi', '-t', String(d), '-i', PLATE, '-c:v', 'libvpx-vp9', '-i', f.src, '-filter_complex', '[1:v]scale=1280:720[o];[0:v][o]overlay=shortest=1', ...X264, '-an', dst]); }
    else if (f.cuts) { const n = f.cuts.length; const parts = f.cuts.map(([s, e], i) => `[0:v]trim=${s}:${e},setpts=PTS-STARTPTS,${SHORT720}[v${i}];[0:a]atrim=${s}:${e},asetpts=PTS-STARTPTS,afade=t=in:d=0.3,afade=t=out:st=${e - s - 0.3}:d=0.3[a${i}]`).join(';');
      ff(['-i', f.src, '-filter_complex', `${parts};${f.cuts.map((_, i) => `[v${i}][a${i}]`).join('')}concat=n=${n}:v=1:a=1[v][a]`, '-map', '[v]', '-map', '[a]', ...X264, ...AAC, dst]); }
    else ff(['-i', f.src, '-vf', SHORT720, ...X264, ...a, dst]);
    console.log('  film', id);
  }
  if (!existsSync(dst)) continue;
  if (!fresh(pst, dst)) ff(['-ss', String(f.poster), '-i', dst, '-frames:v', '1', '-q:v', '3', pst]);
  const m = probe(dst);
  films[id] = { src: `/media/video/${id}.mp4`, poster: `/media/poster/${id}.jpg`, w: m.w, h: m.h, dur: m.dur, audio: m.audio, loop: !!f.loop, title: f.title, note: f.note || '', bytes: statSync(dst).size };
}

/* ------------------------------------------------ images ------------------------------------------------ */
const manual = JSON.parse(readFileSync(join(WS, 'playbook', 'dist', 'manual-data.json'), 'utf8'));
const images = {};
const reg = (key, file) => { if (!existsSync(file)) return false; const m = probe(file); images[key] = { src: `/media/img/${key}${file.endsWith('.gif') ? '.gif' : '.jpg'}`, w: m.w, h: m.h }; return true; };
const toJpg = (key, src, max = 1280, pre = []) => { const dst = join(IM, key + '.jpg'); if (!existsSync(src)) { console.log('  ! missing image source', key); return false; }
  if (!fresh(dst, pre.length ? null : src)) ff([...pre, '-i', src, '-frames:v', '1', '-vf', `scale='if(gt(iw,ih),min(iw,${max}),-2)':'if(gt(iw,ih),-2,min(ih,${max}))':flags=lanczos`, '-q:v', '3', '-map_metadata', '-1', dst]);
  return reg(key, dst); };
// frames of the reference films, named <film>-<seconds> as in the manual
const FRAME_SRC = { karnival: FILMS.karnival.src, aquaA: P('2026-11-18-aquaku-launch/out/aquaku-launch-a-v1.mp4'), aquaB: FILMS['aqua-b'].src, aquaC: FILMS['aqua-c'].src,
  bijakA: FILMS['bijak-a'].src, bijakB: FILMS['bijak-b'].src, bijakC: FILMS['bijak-c'].src, kartunA: FILMS['kartun-a'].src, kartunB: P('2026-11-18-cerita-kartun-30-saat/out/cerita-kartun-30-saat-b-v1.mp4'), kartunC: FILMS['kartun-c'].src,
  reel: FILMS.reel.src, affA: FILMS['book-a'].src, affB: FILMS['book-b'].src, affC: FILMS['book-c'].src, cikgu: FILMS['intro-wide'].src, mag: P('2026-11-18-menjelang-maghrib/out/menjelang-maghrib-v2-silent-1920x1080.mp4') };
const STILLS = { poster: P('2026-11-18-jom-baca-10-minit/out/jom-baca-10-minit-poster-v1-1080x1350.png'), 'poster-a4': P('2026-11-18-jom-baca-10-minit/out/jom-baca-10-minit-poster-v1-a4.png'),
  'board-aqua-0': P('2026-11-18-aquaku-launch/storyboard/a-sehari-semalam/boards/stills/frame-00-at-1s.png'), 'board-aqua-2': P('2026-11-18-aquaku-launch/storyboard/a-sehari-semalam/boards/stills/frame-02-at-5.7s.png'),
  'board-book': P('2026-11-18-menjelang-maghrib/storyboard/c-storybook/boards/stills/frame-01-at-16s.png'), logos: join(PRO, 'ex', 'logos.jpg'), 'before-after': join(PRO, 'ex', 'before-after.jpg') };
const isFrame = key => /^(karnival|aqua[ABC]|bijak[ABC]|kartun[ABC]|reel|aff[ABC]|cikgu|mag)-\d/.test(key);
const sampleFile = {}; for (const c of manual.cards) for (const f of (c.sample && c.sample.files) || []) sampleFile[f.key] = join(PRO, 'samples', f.file);
function image(key) {
  if (images[key]) return true;
  if (sampleFile[key]) return toJpg(key, sampleFile[key], 1600);
  if (STILLS[key]) return toJpg(key, STILLS[key], 1400);
  if (isFrame(key)) { const [, alias, t] = /^([a-zA-Z]+)-(.+)$/.exec(key); return toJpg(key, FRAME_SRC[alias], 960, ['-ss', t.replace('_', '.')]); }
  console.log('  ! no source known for image', key); return false;
}
const wanted = new Set();
for (const c of manual.cards) for (const [k] of (c.example && c.example.shots) || []) wanted.add(k);
for (const s of manual.styles) for (const k of s.examples) wanted.add(k);
for (const [a, b] of manual.levelFigures.boardToFilm.pairs) { wanted.add(a); wanted.add(b); }
for (const k of manual.levelFigures.threeFilms.shots) wanted.add(k);
for (const k of wanted) image(k);
// before and after, for the drag slider: four matching moments (the "before" frames were captured once from the
// original film with tools/capture-before.mjs and are kept in the repo)
const compare = [];
[[5, 'A playful opening'], [47.5, 'Tidy-up, done'], [90.5, 'Getting dressed'], [119.5, 'The prayer']].forEach(([t, label], i) => {
  toJpg(`after-${i + 1}`, FRAME_SRC.mag, 1280, ['-ss', String(t)]); reg(`before-${i + 1}`, join(IM, `before-${i + 1}.jpg`));
  if (images[`before-${i + 1}`] && images[`after-${i + 1}`]) compare.push({ before: `before-${i + 1}`, after: `after-${i + 1}`, label });
});

/* ------------------------------------------------ per-card media ------------------------------------------------ */
const extra = (key, src, max = 1400) => toJpg(key, src, max) ? key : null;
const gif = (key, src) => { const dst = join(IM, key + '.gif'); if (!existsSync(src)) return null; if (!fresh(dst, src)) copyFileSync(src, dst); return reg(key, dst) ? key : null; };
const file = (name, src, label) => { if (!existsSync(src)) return null; const dst = join(FI, name); if (!fresh(dst, src)) copyFileSync(src, dst); return { href: `/media/files/${name}`, label, bytes: statSync(dst).size }; };
const list = pairs => pairs.filter(p => p[0]).map(([key, caption]) => ({ key, caption }));
const SETS = {
  M7: () => list([['yes', 'Yes!'], ['lets-go', "Let's go!"], ['thumbs-up', 'Thumbs-up'], ['star', 'A star'], ['hmm', 'Hmm…']].map(([n, c]) => [gif(`sticker-${n}`, S(`M7-tiny-lab-stickers/out/tiny-lab-${n}.gif`)), c])),
  G3: () => list([1, 2, 3, 4, 5, 6].map(n => [extra(`carousel-plants-${n}`, S(`G3-plants-carousel/out/how-plants-drink-${n}-v1.png`)), `Slide ${n} of 6`])),
  E4: () => list(Array.from({ length: 10 }, (_, i) => [extra(`deck-${i + 1}`, S(`E4-pitch-deck/out/booknest-pitch-deck-v1-slides/slide-${String(i + 1).padStart(2, '0')}.png`), 1600), `Slide ${i + 1} of 10`])),
  M9: () => list([[extra('pack-poster', S('M9-karnival-campaign-pack/out/karnival-sains-2027-poster-1080x1350-v1.png')), 'Poster, 1080x1350'],
    ...[1, 2, 3, 4, 5].map(n => [extra(`pack-carousel-${n}`, S(`M9-karnival-campaign-pack/out/karnival-sains-2027-carousel-${n}-v1.png`)), `Carousel slide ${n} of 5`]),
    [extra('pack-story', S('M9-karnival-campaign-pack/out/karnival-sains-2027-story-1080x1920-v1.png')), 'Story, with sticker space'], [extra('pack-thumb', S('M9-karnival-campaign-pack/out/karnival-sains-2027-thumbnail-1280x720-v1.png')), 'Thumbnail, 1280x720']]),
};
const FILM_OF = { M1: ['karnival'], M2: ['aqua-a', 'aqua-b', 'aqua-c'], M3: ['bijak-a', 'bijak-b', 'bijak-c'], M4: ['book-b', 'book-c', 'book-a'], M5: ['intro-wide', 'intro-tall'], M11: ['hook-question', 'hook-free', 'hook-rocket'],
  U1: ['aqua-c', 'bijak-c'], U2: ['micro-1', 'micro-2', 'micro-3', 'micro-4'], T2: ['overlay-lower-third', 'overlay-topic', 'overlay-score', 'overlay-wipe'], T3: ['stage-loop'], T4: ['book-a'], E3: ['aqua-b', 'kartun-b'],
  S1: ['kartun-c', 'kartun-a', 'kartun-b'], S2: ['routine'], G1: ['reel'], R1: ['routine'], R2: ['routine'], R3: ['intro-wide', 'intro-tall'], R4: ['kartun-c', 'kartun-a', 'kartun-b'], R5: ['karnival', 'karnival-en'], R6: ['karnival'], P3: ['showreel-wide', 'showreel-tall'], P5: ['logo-anim'] };
const FILES = {
  E4: () => [file('booknest-pitch-deck.pptx', S('E4-pitch-deck/out/booknest-pitch-deck-v1.pptx'), 'The deck (.pptx, editable)'), file('booknest-pitch-deck.pdf', S('E4-pitch-deck/out/booknest-pitch-deck-v1.pdf'), 'The deck (PDF)')],
  G1: () => [file('reading-campaign-poster-a4.pdf', P('2026-11-18-jom-baca-10-minit/out/jom-baca-10-minit-poster-v1-a4.pdf'), 'The poster (A4 PDF)')],
  G5: () => [file('certificate-sample.pdf', S('G5-science-fair-certificates/out/certificate-design-sample.pdf'), 'One certificate (A4 PDF)')],
  M9: () => [file('campaign-poster-a4.pdf', S('M9-karnival-campaign-pack/out/karnival-sains-2027-poster-a4-v1.pdf'), 'The poster (A4 PDF)')],
  P2: () => [file('case-study-a4.pdf', S('P2-aquaku-case-study/out/aquaku-case-study-v1-a4.pdf'), 'The case study (A4 PDF)')],
  P5: () => [file('brand-guide.pdf', S('P5-little-sprout-brand-kit/out/guide/little-sprout-brand-guide-v1.pdf'), 'The brand guide (PDF)')],
};
const DEMOS = { U3: ['booknest-scroll.html', 'Open the live page'], U2: ['booknest-micro/', 'Open the live spec page'] };
if (existsSync(S('U3-web-animation/out/booknest-scroll-section-v1.html'))) copyFileSync(S('U3-web-animation/out/booknest-scroll-section-v1.html'), join(OUT, 'demos', 'booknest-scroll.html'));
if (existsSync(S('U2-micro-interactions/out/booknest-micro-v1'))) cpSync(S('U2-micro-interactions/out/booknest-micro-v1'), join(OUT, 'demos', 'booknest-micro'), { recursive: true });

const cards = {};
for (const c of manual.cards) {
  const fl = (FILM_OF[c.id] || []).filter(id => films[id]);
  let imgs = SETS[c.id] ? SETS[c.id]() : ((c.example && c.example.shots) || []).filter(([k]) => images[k] && !(fl.length && isFrame(k)) && k !== 'before-after').map(([key, caption]) => ({ key, caption }));
  const m = { films: fl, images: imgs, files: (FILES[c.id] ? FILES[c.id]() : []).filter(Boolean) };
  if (DEMOS[c.id] && existsSync(join(OUT, 'demos', DEMOS[c.id][0]))) m.demo = { href: '/demos/' + DEMOS[c.id][0], label: DEMOS[c.id][1] };
  if (['R1', 'P1'].includes(c.id) && compare.length) m.compare = true;
  // a small square thumbnail for the library grid
  const tsrc = fl.length ? join(PO, fl[0] + '.jpg') : imgs.length ? join(OUT, images[imgs[0].key].src) : m.compare ? join(IM, 'after-1.jpg') : null;
  if (tsrc && existsSync(tsrc)) { const tdst = join(TH, c.id + '.jpg');
    if (!fresh(tdst, tsrc)) ff(['-i', tsrc, '-frames:v', '1', '-vf', "scale='if(gt(iw,ih),-2,480)':'if(gt(iw,ih),480,-2)':flags=lanczos,crop=480:480:'(iw-480)/2':'if(gt(ih,iw),ih*0.06,0)'", '-q:v', '4', tdst]);
    if (existsSync(tdst)) m.thumb = `/media/thumb/${c.id}.jpg`; }
  cards[c.id] = m;
}

writeFileSync(join(root, 'content', 'manual.json'), JSON.stringify(manual));
writeFileSync(join(root, 'content', 'media.json'), JSON.stringify({ films, images, cards, compare }, null, 1));
const bytes = Object.values(films).reduce((a, f) => a + f.bytes, 0);
console.log(`synced: ${Object.keys(films).length} films (${(bytes / 1048576).toFixed(1)} MB), ${Object.keys(images).length} images, ${Object.values(cards).filter(c => c.films.length || c.images.length || c.compare).length} of ${manual.cards.length} cards with media`);
