import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

process.env.DATABASE_URL ||= 'file:./.local/finance.db';
process.env.JWT_SECRET ||= 'liquid-ledger-local-development-only';

const port = Number(process.env.PORT || 3001);
const publicRoot = resolve('public');
const apiRoot = resolve('api');
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
};

function sendFile(res, filename) {
  if (!filename.startsWith(`${publicRoot}${sep}`) || !existsSync(filename)) return false;
  res.statusCode = 200;
  res.setHeader('Content-Type', mimeTypes[extname(filename)] || 'application/octet-stream');
  res.end(readFileSync(filename));
  return true;
}

async function parseBody(req) {
  if (!['POST', 'PUT', 'PATCH'].includes(req.method || '')) return {};
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 8_000_000) throw new Error('Corpo da requisição excede 8 MB');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function adaptResponse(res) {
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => {
    if (!res.headersSent) res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(payload));
    return res;
  };
  return res;
}

const server = createServer(async (req, nativeRes) => {
  const res = adaptResponse(nativeRes);
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    if (url.pathname === '/__visual-auth' && process.env.LOCAL_VISUAL_AUTH === '1') {
      const [{ default: prisma }, { generateToken, createTokenCookie }] = await Promise.all([
        import('../lib/prisma.js'),
        import('../lib/auth.js'),
      ]);
      const user = await prisma.usuario.findFirst({ orderBy: { id: 'asc' }, select: { id: true, email: true } });
      if (!user) return res.status(404).json({ success: false, message: 'Usuário local não encontrado' });
      res.setHeader('Set-Cookie', createTokenCookie(generateToken(user.id, user.email)));
      res.statusCode = 302;
      res.setHeader('Location', '/app/');
      return res.end();
    }
    if (url.pathname.startsWith('/api/')) {
      const routeName = url.pathname.slice('/api/'.length);
      if (!/^[a-z0-9-]+$/i.test(routeName)) return res.status(404).json({ success: false, message: 'Rota não encontrada' });
      const routeFile = resolve(apiRoot, `${routeName}.js`);
      if (!routeFile.startsWith(`${apiRoot}${sep}`) || !existsSync(routeFile)) {
        return res.status(404).json({ success: false, message: 'Rota não encontrada' });
      }
      req.query = Object.fromEntries(url.searchParams.entries());
      req.body = await parseBody(req);
      const module = await import(`${pathToFileURL(routeFile).href}?v=${Date.now()}`);
      return await module.default(req, res);
    }

    const requested = decodeURIComponent(url.pathname);
    const isAppRoute = requested === '/app' || requested.startsWith('/app/');
    if (isAppRoute && !extname(requested)) return sendFile(res, resolve(publicRoot, 'app/index.html'));
    const relativePath = requested === '/' ? 'index.html' : requested.replace(/^\/+/, '');
    if (sendFile(res, resolve(publicRoot, relativePath))) return;
    res.statusCode = 404;
    res.end('Not found');
  } catch (error) {
    console.error(error);
    if (!res.headersSent) res.status(500).json({ success: false, message: 'Erro interno no servidor local' });
    else res.end();
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Servidor local em http://localhost:${port}`);
});
