import { setCorsHeaders } from '../lib/cors.js';

export default function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  return res.status(200).json({
    success: true,
    status: 'OK',
    service: 'App Financeiro API',
    timestamp: new Date().toISOString(),
  });
}
