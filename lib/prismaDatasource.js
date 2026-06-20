const DATABASE_URL_PLACEHOLDERS = new Set([
  'postgres://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require',
  'postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require',
]);

export function getDatasourceUrl(env = process.env, logger = console) {
  const primary = env.DATABASE_URL?.trim();
  const pooled = env.PRISMA_DATABASE_URL?.trim();
  const direct = env.POSTGRES_URL?.trim();
  const primaryFallbackReason = !primary
    ? 'não está definida'
    : DATABASE_URL_PLACEHOLDERS.has(primary)
      ? 'ainda contém o placeholder de exemplo'
      : null;

  if (pooled && !pooled.startsWith('file:')) {
    logger.info('[Prisma] Usando PRISMA_DATABASE_URL com pool para o ambiente serverless.');
    return pooled;
  }

  if (primaryFallbackReason && direct) {
    logger.info(
      `[Prisma] Usando POSTGRES_URL porque DATABASE_URL ${primaryFallbackReason}.`
    );
    return direct;
  }

  return primary;
}
