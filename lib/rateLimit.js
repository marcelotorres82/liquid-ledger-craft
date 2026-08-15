const buckets = globalThis.__liquidLedgerRateBuckets || new Map();
globalThis.__liquidLedgerRateBuckets = buckets;

function clientKey(req, scope) {
  const forwarded = String(req.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
  const ip = forwarded || req.socket?.remoteAddress || 'unknown';
  return `${scope}:${ip}`;
}

export function enforceRateLimit(req, res, { scope, limit, windowMs }) {
  const now = Date.now();
  const key = clientKey(req, scope);
  const current = buckets.get(key);
  const bucket = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + windowMs }
    : current;
  bucket.count += 1;
  buckets.set(key, bucket);

  res.setHeader('X-RateLimit-Limit', String(limit));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit - bucket.count)));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

  if (bucket.count > limit) {
    res.setHeader('Retry-After', String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))));
    res.status(429).json({ success: false, message: 'Muitas tentativas. Aguarde um pouco e tente novamente.' });
    return false;
  }
  return true;
}
