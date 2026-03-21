#!/bin/bash

echo "🚀 Iniciando App Financeiro - Setup Completo"
echo "=========================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para verificar se comando foi bem sucedido
check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
        exit 1
    fi
}

# Função para mostrar status
show_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 1. Limpar ambiente anterior
show_status "Limpando ambiente anterior..."
rm -f dev.db
rm -f server.log
rm -f *.log

# 2. Instalar dependências (se necessário)
show_status "Verificando dependências..."
if [ ! -d "node_modules" ]; then
    echo "Instalando dependências..."
    npm install
    check_success "Dependências instaladas"
fi

# 3. Gerar Prisma Client
show_status "Gerando Prisma Client..."
npx prisma generate --schema lib/prisma/schema-fixed.prisma
check_success "Prisma Client gerado"

# 4. Criar banco de dados
show_status "Criando banco de dados..."
DATABASE_URL="file:./dev.db" npx prisma db push --schema lib/prisma/schema-fixed.prisma
check_success "Banco de dados criado"

# 5. Popular banco com dados iniciais
show_status "Populando banco de dados..."
DATABASE_URL="file:./dev.db" node seed-final.js
check_success "Banco de dados populado"

# 6. Verificar se usuário foi criado
show_status "Verificando usuário..."
USER_COUNT=$(DATABASE_URL="file:./dev.db" node -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.usuario.count().then(count => console.log(count)).finally(() => prisma.\$disconnect());
" 2>/dev/null)

if [ "$USER_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Usuário criado com sucesso${NC}"
else
    echo -e "${YELLOW}⚠️  Nenhum usuário encontrado${NC}"
fi

# 7. Build do frontend
show_status "Build do frontend..."
npm run ui:build
check_success "Frontend build concluído"

# 8. Iniciar servidor
show_status "Iniciando servidor..."
echo -e "${GREEN}🎉 Setup concluído!${NC}"
echo ""
echo -e "${BLUE}📱 Acesse:${NC}"
echo -e "   Login: ${YELLOW}http://localhost:3001${NC}"
echo -e "   App:   ${YELLOW}http://localhost:3001/app${NC}"
echo ""
echo -e "${BLUE}🔑 Credenciais:${NC}"
echo -e "   Login: ${YELLOW}marcelo${NC}"
echo -e "   Senha: ${YELLOW}042016${NC}"
echo ""
echo -e "${BLUE}📊 API Endpoints:${NC}"
echo -e "   Health: ${YELLOW}GET  http://localhost:3001/health${NC}"
echo -e "   Auth:   ${YELLOW}POST http://localhost:3001/api/auth${NC}"
echo -e "   Dashboard: ${YELLOW}GET  http://localhost:3001/api/dashboard${NC}"
echo ""
echo -e "${GREEN}🚀 Iniciando servidor...${NC}"

# Iniciar servidor em background
DATABASE_URL="file:./dev.db" \
JWT_SECRET="a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6" \
GEMINI_API_KEY="AIzaSyAqcO0JcrYDfJzz96nAJqLBKKam2aywm5I" \
GEMINI_MODEL="gemini-2.5-flash" \
PORT=3001 \
node server-final.js
