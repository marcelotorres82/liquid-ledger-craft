#!/bin/bash

echo "🔧 Verificando status do projeto..."

# Verificar se estamos na pasta correta
if [ ! -f "package.json" ]; then
    echo "❌ Erro: package.json não encontrado. Execute este script na raiz do projeto."
    exit 1
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Erro: Node.js não está instalado."
    exit 1
fi

echo "✅ Node.js: $(node --version)"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ Erro: npm não está instalado."
    exit 1
fi

echo "✅ npm: $(npm --version)"

# Verificar dependências
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Verificar se o backend está rodando
echo "🔍 Verificando se o backend está rodando..."
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Backend está rodando em http://localhost:3000"
else
    echo "⚠️  Backend não está rodando. Iniciando servidor de desenvolvimento..."
    cd .. && npm run dev:vercel &
    sleep 3
fi

# Iniciar frontend
echo "🚀 Iniciando servidor de desenvolvimento do frontend..."
cd frontend
npm run dev
