import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const root = process.cwd();
const PORT = 5001;
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  try {
    let p = decodeURI(new URL(req.url, 'http://localhost').pathname);
    if (p === '/' || p === '') p = '/index.html';
    // ne servir que la racine du repo (sécurité basique)
    if (p.includes('..')) { res.statusCode = 400; res.end('bad'); return; }
    const data = await readFile(join(root, p));
    res.setHeader('Content-Type', mime[extname(p)] || 'application/octet-stream');
    res.end(data);
  } catch (e) {
    res.statusCode = 404;
    res.end('not found');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.error(`[local-server] listening on http://127.0.0.1:${PORT}`);
});

export default server;
