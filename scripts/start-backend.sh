#!/bin/bash

echo "🚀 Iniciando backend na porta 3001..."

# Limpar banco anterior
rm -f dev.db

# Iniciar backend
DATABASE_URL="file:./dev.db" \
JWT_SECRET="a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6" \
GEMINI_API_KEY="AIzaSyAqcO0JcrYDfJzz96nAJqLBKKam2aywm5I" \
GEMINI_MODEL="gemini-1.5-pro" \
PORT=3001 \
npx vercel dev --port 3001
