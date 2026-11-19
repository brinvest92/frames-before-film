// capture-before.mjs - one-off: saves four frames of the ORIGINAL routine film (a canvas page) for the before/after
// slider. It needs a Chromium browser and the puppeteer-core package, which this site does not otherwise use:
//   node tools/capture-before.mjs <path to puppeteer-core> <path to the original .html>
// The four JPEGs it writes to static/media/img/ are kept in the repo, so nobody needs to run this again.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..'), out = join(root, 'static', 'media', 'img');
mkdirSync(out, { recursive: true });
const puppeteer = createRequire(import.meta.url)(resolve(process.argv[2]));
const page0 = resolve(process.argv[3]);
const exe = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync);
const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--window-size=1920,1080'] });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
await page.goto(pathToFileURL(page0).href + '#capture', { waitUntil: 'load' });
const TIMES = [8, 36, 92, 104];          // the moments that match the remake's frames at 5, 47.5, 90.5 and 119.5 s
for (let i = 0; i < TIMES.length; i++) {
  const url = await page.evaluate(t => window.renderAt(t, 0.9), TIMES[i]);
  writeFileSync(join(out, `before-${i + 1}-full.jpg`), Buffer.from(url.split(',')[1], 'base64'));
  console.log('captured', TIMES[i], 's');
}
await browser.close();
