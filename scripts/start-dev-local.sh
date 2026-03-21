#!/bin/bash

echo "🚀 Iniciando ambiente de desenvolvimento local..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado"
    exit 1
fi

# Limpar logs anteriores
rm -f server.log

# Iniciar backend com SQLite local
echo "📊 Iniciando backend com SQLite local..."
DATABASE_URL="file:./dev.db" \
JWT_SECRET="a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6" \
GEMINI_API_KEY="AIzaSyAqcO0JcrYDfJzz96nAJqLBKKam2aywm5I" \
GEMINI_MODEL="gemini-2.5-flash" \
PORT=3001 \
npx vercel dev --port 3001 > server.log 2>&1 &

BACKEND_PID=$!
echo "📋 Backend PID: $BACKEND_PID"

# Aguardar backend iniciar
sleep 5

# Iniciar frontend
echo "🎨 Iniciando frontend..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!

echo "📱 Frontend PID: $FRONTEND_PID"

echo ""
echo "✅ Ambiente iniciado!"
echo "📊 Backend: http://localhost:3001"
echo "🎨 Frontend: http://localhost:5173/app/#/"
echo ""
echo "📋 Logs:"
echo "  Backend: tail -f server.log"
echo "  Frontend: tail -f frontend.log"
echo ""
echo "🛑 Para parar: kill $BACKEND_PID $FRONTEND_PID"

# Manter script rodando
wait
