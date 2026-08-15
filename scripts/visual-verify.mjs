import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const port = process.env.VISUAL_VERIFY_PORT || '3001';
const baseUrl = `http://localhost:${port}`;
const browserExecutable = process.env.AGENT_BROWSER_EXECUTABLE_PATH
  || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const auditDirectory = resolve('lib/prisma/.local/visual-browser-profile');
const screenshot = resolve('lib/prisma/.local/dashboard-verification.png');

if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
  throw new Error('DATABASE_URL e JWT_SECRET são obrigatórios para a auditoria visual.');
}

mkdirSync(auditDirectory, { recursive: true });

async function waitForServer(timeoutMs = 45_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // O servidor ainda está iniciando.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  }
  throw new Error(`Servidor não respondeu em ${baseUrl}`);
}

function runChrome(extraArgs) {
  return spawnSync(browserExecutable, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${auditDirectory}`,
    '--virtual-time-budget=7000',
    ...extraArgs,
    `${baseUrl}/__visual-auth`,
  ], { encoding: 'utf8', timeout: 35_000, windowsHide: true });
}

const server = spawn(process.execPath, ['scripts/local-server.mjs'], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: port, FRONTEND_URL: baseUrl, LOCAL_VISUAL_AUTH: '1' },
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
});

let serverOutput = '';
server.stdout.on('data', (chunk) => { serverOutput += chunk.toString(); });
server.stderr.on('data', (chunk) => { serverOutput += chunk.toString(); });

try {
  await waitForServer();
  const domResult = runChrome(['--dump-dom']);
  if (domResult.status !== 0) throw new Error(domResult.stderr || 'Chrome não conseguiu abrir o app');
  const dom = domResult.stdout;
  const requiredTexts = ['Copiloto financeiro', 'Movimentações recentes', 'Dados e integrações'];
  const missing = requiredTexts.filter((text) => !dom.includes(text));
  if (missing.length || dom.includes('vite-error-overlay')) {
    throw new Error(`Auditoria visual incompleta. Ausentes: ${missing.join(', ') || 'nenhum'}; overlay=${dom.includes('vite-error-overlay')}`);
  }

  const screenshotResult = runChrome([`--screenshot=${screenshot}`, '--window-size=1440,1200']);
  if (screenshotResult.status !== 0) throw new Error(screenshotResult.stderr || 'Falha ao capturar tela');
  process.stdout.write(`VISUAL_OK ${baseUrl}/app/\nSCREENSHOT ${screenshot}\n`);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : error}\n${serverOutput.slice(-4000)}\n`);
  process.exitCode = 1;
} finally {
  if (process.platform === 'win32' && server.pid) {
    spawnSync('taskkill.exe', ['/PID', String(server.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
  } else {
    server.kill('SIGTERM');
  }
}
