#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const results = {
  passed: [],
  failed: [],
  warnings: []
};

function test(name, fn) {
  try {
    fn();
    results.passed.push(name);
    console.log(`✅ ${name}`);
  } catch (e) {
    results.failed.push({ name, error: e.message });
    console.log(`❌ ${name}: ${e.message}`);
  }
}

function warn(message) {
  results.warnings.push(message);
  console.log(`⚠️  ${message}`);
}

console.log('🧪 Testando projeto App Financeiro\n');

// Test 1: Estrutura de arquivos
test('Arquivos principais existem', () => {
  const required = [
    'frontend/src/App.tsx',
    'frontend/src/main.tsx',
    'frontend/vite.config.ts',
    'api/insights.js',
    'vercel.json'
  ];
  for (const file of required) {
    if (!fs.existsSync(file)) throw new Error(`Arquivo não encontrado: ${file}`);
  }
});

// Test 2: Configuração Vite
test('Vite config base está correta', () => {
  const config = fs.readFileSync('frontend/vite.config.ts', 'utf8');
  if (!config.includes("base: '/app/'")) {
    throw new Error('Vite base deve ser /app/');
  }
});

// Test 3: HashRouter sem basename
test('HashRouter configurado corretamente', () => {
  const app = fs.readFileSync('frontend/src/App.tsx', 'utf8');
  if (app.includes('basename=')) {
    throw new Error('HashRouter não deve ter basename (conflito com Vite base)');
  }
  if (!app.includes('<HashRouter>')) {
    throw new Error('HashRouter não encontrado');
  }
});

// Test 4: Rotas configuradas
test('Rotas principais configuradas', () => {
  const app = fs.readFileSync('frontend/src/App.tsx', 'utf8');
  const routes = ['/', '/income', '/expenses', '/savings', '/analytics'];
  for (const route of routes) {
    if (!app.includes(`path="${route}"`)) {
      throw new Error(`Rota ${route} não encontrada`);
    }
  }
});

// Test 5: Componentes Dashboard
test('Dashboard tem estrutura correta', () => {
  const dashboard = fs.readFileSync('frontend/src/pages/Dashboard.tsx', 'utf8');
  if (!dashboard.includes('AiInsightsCard')) throw new Error('AiInsightsCard não encontrado');
  if (!dashboard.includes('Agenda de vencimentos')) throw new Error('Seção de agenda não encontrada');
  if (!dashboard.includes('Projeção de saldo')) throw new Error('Seção de projeção não encontrada');
  if (!dashboard.includes('Movimentações recentes')) throw new Error('Seção de movimentações não encontrada');
  
  // Verificar ordem
  const agendaIndex = dashboard.indexOf('Agenda de vencimentos');
  const projectionIndex = dashboard.indexOf('Projeção de saldo');
  const transactionsIndex = dashboard.indexOf('Movimentações recentes');
  
  if (!(agendaIndex < projectionIndex && projectionIndex < transactionsIndex)) {
    throw new Error('Ordem das seções incorreta (deve ser: Agenda -> Projeção -> Movimentações)');
  }
});

// Test 6: API de Insights
test('API de Insights configurada', () => {
  const insights = fs.readFileSync('api/insights.js', 'utf8');
  if (!insights.includes('GoogleGenerativeAI')) {
    throw new Error('GoogleGenerativeAI não importado');
  }
  if (!insights.includes('GEMINI_API_KEY')) {
    throw new Error('GEMINI_API_KEY não referenciado');
  }
});

// Test 7: Dependências instaladas
test('Dependências do frontend', () => {
  const pkg = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
  const required = ['react', 'react-router-dom', 'framer-motion', 'zustand', 'lucide-react'];
  for (const dep of required) {
    if (!pkg.dependencies[dep]) {
      throw new Error(`Dependência ${dep} não encontrada`);
    }
  }
});

// Test 8: Gemini no backend
test('Dependência Gemini instalada', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (!pkg.dependencies['@google/generative-ai']) {
    throw new Error('@google/generative-ai não instalado');
  }
});

// Test 9: Vercel config
test('Configuração Vercel.json', () => {
  const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  if (!vercel.rewrites || vercel.rewrites.length === 0) {
    throw new Error('Rewrites não configurados no vercel.json');
  }
  const hasAppRewrite = vercel.rewrites.some(r => r.source === '/app/(.*)');
  if (!hasAppRewrite) {
    throw new Error('Rewrite para /app/(.*) não encontrado');
  }
});

// Test 10: Verificar .env.local
test('Variáveis de ambiente', () => {
  if (fs.existsSync('.env.local')) {
    const env = fs.readFileSync('.env.local', 'utf8');
    if (!env.includes('GEMINI_API_KEY')) {
      warn('GEMINI_API_KEY não encontrada no .env.local');
    }
  } else {
    warn('.env.local não encontrado');
  }
});

// Resumo
console.log('\n📊 Resumo dos Testes:');
console.log(`✅ Passaram: ${results.passed.length}`);
console.log(`❌ Falharam: ${results.failed.length}`);
console.log(`⚠️  Avisos: ${results.warnings.length}`);

if (results.failed.length > 0) {
  console.log('\n❌ Falhas:');
  results.failed.forEach(f => console.log(`  - ${f.name}: ${f.error}`));
  process.exit(1);
} else {
  console.log('\n🎉 Todos os testes passaram!');
  process.exit(0);
}
