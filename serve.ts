import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./app/', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };

export function createStaticServer() {
  return createServer(async (request, response) => {
    if (!['GET', 'HEAD'].includes(request.method || '')) {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    try {
      const pathname = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname);
      const path = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!path.startsWith(resolve(root) + sep)) throw new Error('Outside static root');
      const canonical = await realpath(path);
      if (!canonical.startsWith(resolve(root) + sep)) throw new Error('Outside static root');
      const info = await stat(canonical);
      if (!info.isFile()) throw new Error('Not a regular file');
      const cache = ['.svg', '.woff2'].includes(extname(canonical)) ? 'public, max-age=3600' : 'no-store';
      response.writeHead(200, { 'Content-Type': types[extname(canonical)] || 'application/octet-stream', 'Cache-Control': cache, 'X-Content-Type-Options': 'nosniff' });
      response.end(request.method === 'HEAD' ? undefined : await readFile(canonical));
    } catch {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argument = process.argv.indexOf('--port');
  const port = Number(argument >= 0 ? process.argv[argument + 1] : process.env.PORT || 8080);
  createStaticServer().listen(port, '127.0.0.1', () => console.log(`Fieldnote is ready at http://127.0.0.1:${port}`));
}
