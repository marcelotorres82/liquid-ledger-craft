import aiStatus from '../routes/ai-status.js';
import copilot from '../routes/copilot.js';
import research from '../routes/research.js';
import smartEntry from '../routes/smart-entry.js';

const routes = {
  'ai-status': aiStatus,
  copilot,
  research,
  'smart-entry': smartEntry,
};

export default async function handler(req, res) {
  const route = String(req.query?.route || '');
  const routeHandler = routes[route];
  if (!routeHandler) return res.status(404).json({ success: false, message: 'Rota de IA não encontrada' });
  return routeHandler(req, res);
}
