const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : null,
].filter(Boolean);

function getRequestOrigin(req) {
  const forwardedHost = req.headers['x-forwarded-host'];
  const host = String(forwardedHost || req.headers.host || '').split(',')[0].trim();
  if (!host) return null;

  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol = String(forwardedProto || (host.startsWith('localhost') ? 'http' : 'https'))
    .split(',')[0]
    .trim();

  return `${protocol}://${host}`;
}

export function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  const requestOrigin = getRequestOrigin(req);
  
  // Se for ambiente de desenvolvimento (localhost), permitir
  const isLocal = origin && (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1'));
  
  if (origin && (isLocal || origin === requestOrigin || ALLOWED_ORIGINS.includes(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');
}
