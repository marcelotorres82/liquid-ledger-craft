# 💰 Liquid Ledger Craft — Controle Financeiro com IA

Aplicação web moderna de controle financeiro pessoal com insights de inteligência artificial, construída com React + Node.js + PostgreSQL.

![Dashboard Preview](https://img.shields.io/badge/Status-Production-green) ![Vercel](https://img.shields.io/badge/Deploy-Vercel-black) ![React](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-blue) ![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Prisma-green)

## ✨ Funcionalidades

- **Dashboard financeiro** com visão geral de receitas, despesas e saldo
- **Contas a pagar** — despesas pagas são subtraídas automaticamente do total pendente
- **Categorias dinâmicas** — compras são agrupadas por mês de referência ("Compras do mês 03")
- **Controle de despesas** fixas, variáveis e parceladas com status de pagamento
- **Controle de receitas** fixas e variáveis
- **Insights de IA** — análises automáticas do Google Gemini sobre gastos e economia
- **Sistema de caixinhas** — distribuição automática do saldo entre categorias (Casa, Carro, Reserva, etc.)
- **Interface glassmorphism** — design Apple-like com efeitos de vidro, gradientes e micro-animações
- **PWA** — pode ser instalado como app no celular
- **Dark mode** — alternância de tema claro/escuro
- **Copiloto financeiro** — perguntas sobre 12 meses de histórico, evidências e ações que exigem confirmação
- **Entrada inteligente** — lançamento por texto, voz ou foto de recibo com prévia editável
- **Importação de extratos** — CSV e OFX, com detecção de arquivo duplicado
- **Insights acionáveis** — comparação histórica, impacto em reais e criação confirmada de orçamento
- **Portabilidade** — backup JSON, planilha CSV e calendário ICS de vencimentos
- **Privacidade rápida** — oculta valores sensíveis durante o uso em público
- **Pesquisa externa opcional** — Perplexity Search sem enviar o extrato financeiro do usuário

## 🧠 Arquitetura de IA

O app usa uma camada de provedores com fallback. O padrão é `AI_PROVIDER_MODE=gemini-only`, que impede chamadas cobradas à OpenAI ou Perplexity API. O modo `auto` somente deve ser habilitado conscientemente:

1. Gemini é priorizado na interpretação de lançamentos e geração de insights.
2. Gemini também processa o copiloto e a leitura multimodal de recibos.
3. Regras locais mantêm lançamento e análises básicas disponíveis quando as APIs falham.
4. A pesquisa abre o site do Perplexity e usa a sessão/assinatura do usuário, sem consumir a API pelo app.

Todas as respostas destinadas à interface usam JSON Schema estrito. A IA nunca grava uma ação sugerida diretamente: o usuário revisa e confirma antes do endpoint de escrita ser chamado.

> A assinatura do ChatGPT não inclui créditos da OpenAI API. A chave pode estar configurada e ainda exigir faturamento/cota no painel da API; nesse caso o app usa Gemini ou regras locais automaticamente.

Variáveis adicionais:

| Variável | Uso |
|---|---|
| `OPENAI_API_KEY` | Copiloto e leitura de recibos |
| `OPENAI_MODEL` | Modelo OpenAI fixo; padrão `gpt-5.6-luna` |
| `OPENAI_REASONING_EFFORT` | Esforço do copiloto; padrão `low` |
| `PERPLEXITY_API_KEY` | Pesquisa externa opcional |
| `AI_TIMEOUT_MS` | Timeout das chamadas de IA |
| `AI_MAX_OUTPUT_TOKENS` | Limite de saída por chamada |

## 🔄 Atualização do banco

As mudanças de schema são aditivas e preservam receitas e despesas existentes. Antes do primeiro deploy desta versão, sincronize o banco:

```bash
npm run db:sync:prod
```

Para o SQLite local:

```bash
npm run db:sync:local
```

Faça um backup antes de qualquer alteração de schema em produção. O build da Vercel gera o Prisma Client e sincroniza este schema aditivo antes de publicar a nova versão; se a conexão falhar, o deployment é interrompido e a versão anterior permanece ativa.

## 🔌 Novos endpoints

| Endpoint | Função |
|---|---|
| `POST /api/smart-entry` | Interpretar e confirmar lançamentos inteligentes |
| `POST /api/copilot` | Perguntas financeiras com histórico do próprio usuário |
| `GET/POST /api/budgets` | Consultar e criar orçamentos |
| `POST /api/imports` | Importar lotes CSV/OFX validados |
| `GET /api/export` | Exportar JSON, CSV ou ICS |
| `POST /api/research` | Pesquisa externa opcional |
| `GET /api/ai-status` | Estado seguro dos provedores e execuções recentes, sem expor chaves |

## 🏗️ Arquitetura

```
liquid-ledger-craft/
├── api/                    # Backend — Serverless Functions (Vercel)
│   ├── auth.js             # Autenticação JWT (login, logout, check)
│   ├── dashboard.js        # Resumo financeiro + cálculos
│   ├── despesas.js         # CRUD de despesas
│   ├── receitas.js         # CRUD de receitas
│   └── insights.js         # Insights de IA com Gemini
├── frontend/               # Frontend — React + TypeScript + Vite
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/          # Páginas (Dashboard, Expenses, Income, etc.)
│   │   ├── store/          # Estado global (Zustand)
│   │   ├── services/       # Camada de API
│   │   ├── lib/            # Utilitários e helpers
│   │   └── types/          # Tipos TypeScript
│   └── public/             # Assets estáticos
├── lib/
│   ├── prisma/
│   │   ├── schema.prisma   # Schema do banco de dados
│   │   └── seed.js         # Seed do usuário padrão
│   ├── db.js               # Conexão direta com PostgreSQL
│   ├── prisma.js           # Client Prisma (Accelerate)
│   └── auth.js             # Verificação de token JWT
├── public/                 # Login page + assets estáticos
└── mobile-apk/twa/        # TWA Android para gerar APK
```

## 🧰 Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Zustand |
| Backend | Node.js, Express (serverless functions via Vercel) |
| Banco de dados | PostgreSQL (Vercel Postgres / Prisma Accelerate) |
| ORM | Prisma Client |
| IA | OpenAI Responses API, Google Gemini, Perplexity Search e fallback local |
| Autenticação | JWT + bcryptjs |
| Deploy | Vercel |
| Mobile | TWA (Trusted Web Activity) → APK |

## 🚀 Como Replicar

### Pré-requisitos

- [Node.js](https://nodejs.org/) v18+
- Uma conta na [Vercel](https://vercel.com) (gratuita)
- Uma chave de API do [Google AI Studio](https://aistudio.google.com/app/apikey) (gratuita)

### 1. Clone o repositório

```bash
git clone https://github.com/marcelotorres1982/liquid-ledger-craft.git
cd liquid-ledger-craft
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Preencha o arquivo `.env` com seus valores:

| Variável | Descrição | Onde obter |
|----------|-----------|------------|
| `DATABASE_URL` | URL de conexão PostgreSQL | Vercel → Storage → Postgres |
| `POSTGRES_URL` | Mesma URL de conexão | Vercel → Storage → Postgres |
| `PRISMA_DATABASE_URL` | URL Prisma Accelerate/Prisma Postgres com pool (prioritária em produção) | Vercel → Storage → Postgres (Prisma tab) |
| `JWT_SECRET` | Hash secreto para tokens | Execute: `openssl rand -hex 32` |
| `GEMINI_API_KEY` | Chave API do Gemini | [AI Studio](https://aistudio.google.com/app/apikey) |
| `GEMINI_MODEL` | Modelo Gemini | Padrão `gemini-3.6-flash` (Free Tier quando o projeto não tem faturamento) |
| `DEFAULT_PASSWORD` | Senha do usuário padrão | Use a senha que quiser |

### 3. Crie o banco de dados na Vercel

1. Acesse [vercel.com](https://vercel.com) e crie um projeto
2. Vá em **Storage** → **Create Database** → **Postgres**
3. Escolha a opção **Prisma Accelerate** (recomendado)
4. Copie as credenciais geradas para o `.env`

### 4. Instale as dependências

```bash
npm install
cd frontend && npm install && cd ..
```

### 5. Gere o cliente Prisma e aplique o schema

```bash
npx prisma generate
npx prisma db push
```

### 6. Popule o banco com o usuário padrão

```bash
npx prisma db seed
```

> O seed cria o usuário `marcelo` com a senha definida na variável `DEFAULT_PASSWORD` (ou `changeme` se não definida).

### 7. Build do frontend

```bash
npm run ui:build
```

### 8. Deploy na Vercel

```bash
npm install -g vercel
vercel link
vercel env pull .env.local
vercel --prod
```

> **Importante:** Configure as mesmas variáveis de ambiente no painel da Vercel em **Settings → Environment Variables**.

### 9. (Opcional) Rode localmente

```bash
npm run dev:local
```

O app será acessível em `http://localhost:3001`. Sem um arquivo `.env`, o modo local usa SQLite e a credencial `marcelo` / `changeme-local`; altere `DEFAULT_PASSWORD` para uso contínuo.

## 📱 Compilar APK Android (TWA)

Para instalar como app nativo no Android:

1. Instale o [Android SDK](https://developer.android.com/studio/command-line) e Java 17+
2. Navegue para `mobile-apk/twa/`
3. Atualize o `build.gradle` com sua URL do Vercel
4. Gere uma keystore:
   ```bash
   keytool -genkey -v -keystore android.keystore -alias android -keyalg RSA -keysize 2048 -validity 10000
   ```
5. Compile:
   ```bash
   ./gradlew assembleRelease
   ```
6. O APK estará em `app/build/outputs/apk/release/`

## 🔒 Segurança

- Senhas são hasheadas com bcrypt (10 rounds)
- Autenticação via JWT com token httpOnly
- Variáveis sensíveis NUNCA são commitadas (protegidas pelo `.gitignore`)
- Cada pessoa deve usar sua própria instância do Vercel e banco de dados

## 📄 Licença

MIT License — sinta-se livre para usar, modificar e distribuir.

---

**Criado por [Marcelo Torres Alves](https://github.com/marcelotorres1982) — 2026**
