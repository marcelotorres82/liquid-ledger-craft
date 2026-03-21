#!/bin/bash

echo "🚀 Iniciando ambiente simplificado..."

# Parar processos anteriores
pkill -f "vercel dev" || true
pkill -f "npm run dev" || true

# Limpar arquivos
rm -f dev.db server.log frontend.log

# Criar schema simplificado
cat > schema-simple.prisma << 'EOF'
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

model Usuario {
  id        Int      @id @default(autoincrement())
  nome      String
  email     String   @unique
  senha     String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
}
EOF

# Gerar client
echo "📦 Gerando Prisma client..."
npx prisma generate --schema schema-simple.prisma

# Criar banco
echo "💾 Criando banco de dados..."
npx prisma db push --schema schema-simple.prisma

# Criar usuário
echo "👤 Criando usuário padrão..."
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: { db: { url: 'file:./dev.db' } }
});

async function main() {
  const hashedPassword = await bcrypt.hash('042016', 10);
  await prisma.usuario.upsert({
    where: { email: 'marcelo' },
    update: {},
    create: {
      nome: 'marcelo',
      email: 'marcelo', 
      senha: hashedPassword
    }
  });
  console.log('✅ Usuário marcelo criado com senha 042016');
  await prisma.\$disconnect();
}

main().catch(console.error);
"

# Iniciar backend
echo "🌐 Iniciando backend na porta 3001..."
DATABASE_URL="file:./dev.db" \
JWT_SECRET="a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6" \
GEMINI_API_KEY="AIzaSyAqcO0JcrYDfJzz96nAJqLBKKam2aywm5I" \
GEMINI_MODEL="gemini-2.5-flash" \
PORT=3001 \
npx vercel dev > server.log 2>&1 &

BACKEND_PID=$!
echo "📋 Backend PID: $BACKEND_PID"

# Iniciar frontend
echo "🎨 Iniciando frontend..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!

echo "📱 Frontend PID: $FRONTEND_PID"

echo ""
echo "✅ Ambiente iniciado!"
echo "🌐 Backend: http://localhost:3001"
echo "🎨 Frontend: http://localhost:5173/app/#/"
echo "👤 Usuário: marcelo"
echo "🔑 Senha: 042016"
echo ""
echo "📋 Logs disponíveis em:"
echo "  Backend: tail -f server.log"
echo "  Frontend: tail -f frontend.log"

wait
