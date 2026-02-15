# Liquid Ledger Craft

Aplicação de controle financeiro com interface mobile-first, CRUD de receitas/despesas/metas e backend em funções serverless para deploy na Vercel.

## Stack

- React + Vite + TypeScript
- Zustand para estado global
- Tailwind + shadcn/ui
- API serverless em `api/finance.js` (compatível com Vercel)

## Rodando localmente

```bash
npm install
npm run dev
```

> Em ambiente local sem API ativa, o app usa fallback local no frontend.

## Backend

A API está em `api/finance.js` e expõe:

- `GET /api/finance` — retorna receitas, despesas, metas e `nextId`
- `POST /api/finance` — cria receita, despesa ou meta
- `PATCH /api/finance` — atualiza receita/despesa
- `DELETE /api/finance?type=income|expense&id=<id>` — remove receita/despesa

## Deploy na Vercel

1. Importe o repositório na Vercel.
2. Framework preset: **Vite**.
3. Build command: `npm run build`
4. Output directory: `dist`

O arquivo `vercel.json` já está configurado para manter as rotas SPA e as rotas de API.
