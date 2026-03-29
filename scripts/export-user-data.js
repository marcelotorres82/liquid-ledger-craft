import { PrismaClient } from '@prisma/client';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

function getArgValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

async function main() {
  const login = getArgValue('--login') ?? getArgValue('--email') ?? getArgValue('--user');
  const outPath = getArgValue('--out');

  if (!login) {
    console.error('Uso: node scripts/export-user-data.js --login <email_ou_nome> [--out <arquivo.json>]');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const user = await prisma.usuario.findFirst({
      where: {
        OR: [{ email: login }, { nome: login }],
      },
    });

    if (!user) {
      console.error(`Usuário não encontrado para login: ${login}`);
      process.exit(1);
    }

    const [receitas, despesas, insights] = await Promise.all([
      prisma.receita.findMany({
        where: { usuarioId: user.id },
        orderBy: { dataRegistro: 'asc' },
      }),
      prisma.despesa.findMany({
        where: { usuarioId: user.id },
        orderBy: { dataInicio: 'asc' },
      }),
      prisma.insight.findMany({
        where: { usuarioId: user.id },
        orderBy: [{ ano: 'asc' }, { mes: 'asc' }],
      }),
    ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      user: { id: user.id, nome: user.nome, email: user.email },
      receitas,
      despesas,
      insights,
    };

    const fallbackName = `backup-${(user.email || user.nome || 'user')
      .toString()
      .replaceAll(/[^a-zA-Z0-9_-]+/g, '_')}-${new Date()
      .toISOString()
      .replaceAll(':', '')
      .replaceAll('.', '')}.json`;

    const filePath = outPath
      ? path.resolve(outPath)
      : path.resolve(process.cwd(), fallbackName);

    await writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8');

    console.log('✅ Export concluído');
    console.log('Arquivo:', filePath);
    console.log('Totais:', {
      receitas: receitas.length,
      despesas: despesas.length,
      insights: insights.length,
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('❌ Falha no export:', err?.message ?? err);
  process.exit(1);
});

