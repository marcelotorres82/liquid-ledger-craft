import { verifyToken } from '../lib/auth.js';
import { setCorsHeaders } from '../lib/cors.js';
import { enforceRateLimit } from '../lib/rateLimit.js';

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Método não permitido' });
  const userId = await verifyToken(req);
  if (!userId) return res.status(401).json({ success: false, message: 'Não autenticado' });
  if (!enforceRateLimit(req, res, { scope: `research-${userId}`, limit: 10, windowMs: 60_000 })) return;

  const query = String(req.body?.query || '').trim().slice(0, 500);
  if (!query) return res.status(400).json({ success: false, message: 'Informe o que deseja pesquisar.' });
  return res.status(200).json({
    success: true,
    mode: 'browser',
    results: [{
      title: `Pesquisar “${query}” no Perplexity`,
      url: `https://www.perplexity.ai/search?q=${encodeURIComponent(query)}`,
      snippet: 'Abre o Perplexity no navegador e utiliza sua assinatura, sem consumo da API pelo aplicativo.',
    }],
  });
}
