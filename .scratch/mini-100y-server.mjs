import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const ROOT = 'C:/Users/User/Documents/GitHub/dataeconomics/dist/100y';
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.png': 'image/png', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.json': 'application/json', '.txt': 'text/plain' };

const server = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  let full = join(ROOT, p);
  if (!extname(full)) {
    const withHtml = full + '.html';
    if (existsSync(withHtml)) full = withHtml;
    else if (existsSync(join(full, 'index.html'))) full = join(full, 'index.html');
  }
  if (!existsSync(full) || statSync(full).isDirectory()) {
    res.writeHead(404); res.end('not found'); return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[extname(full)] || 'application/octet-stream' });
  createReadStream(full).pipe(res);
});
server.listen(3901, () => console.log('mini 100y server on 3901'));
