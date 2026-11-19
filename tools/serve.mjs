// serve.mjs - a tiny local preview server for dist/. No dependencies.   node tools/serve.mjs [port]
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const dist = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist'), port = +(process.argv[2] || process.env.PORT || 4173);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2', '.pdf': 'application/pdf', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation' };
createServer((req, res) => {
  let p = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, ''), file = join(dist, p);
  if (!file.startsWith(dist)) { res.writeHead(403).end(); return; }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) { file = join(dist, '404.html'); res.statusCode = 404; }
  const size = statSync(file).size, type = TYPES[extname(file)] || 'application/octet-stream', range = /bytes=(\d+)-(\d*)/.exec(req.headers.range || '');
  if (range) { const start = +range[1], end = range[2] ? +range[2] : size - 1;      // videos seek with range requests
    res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 }); createReadStream(file, { start, end }).pipe(res); return; }
  res.writeHead(res.statusCode, { 'Content-Type': type, 'Content-Length': size, 'Accept-Ranges': 'bytes' }); createReadStream(file).pipe(res);
}).listen(port, () => console.log(`preview: http://localhost:${port}`));
