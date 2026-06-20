const DATABASE_URL_PLACEHOLDERS = new Set([
  'postgres://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require',
  'postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require',
]);

export function getDatasourceUrl(env = process.env, logger = console) {
  const primary = env.DATABASE_URL?.trim();
  const fallback = env.POSTGRES_URL?.trim();
  const fallbackReason = !primary
    ? 'não está definida'
    : DATABASE_URL_PLACEHOLDERS.has(primary)
      ? 'ainda contém o placeholder de exemplo'
      : null;

  if (fallbackReason && fallback) {
    logger.info(
      `[Prisma] Usando POSTGRES_URL porque DATABASE_URL ${fallbackReason}.`
    );
    return fallback;
  }

  return primary;
}
