import { Router } from 'express';

const router = Router();

const HERMES_API = process.env.HERMES_API_URL || 'http://localhost:8642';
const API_KEY = process.env.API_SERVER_KEY || '';

router.post('/chat', async (req, res) => {
  const headers = { 'Content-Type': 'application/json' };
  if (API_KEY) headers['Authorization'] = `Bearer ${API_KEY}`;
  if (req.headers['x-hermes-session-id']) {
    headers['X-Hermes-Session-Id'] = req.headers['x-hermes-session-id'];
  }

  try {
    const upstream = await fetch(`${HERMES_API}/v1/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...req.body, stream: true }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => '');
      return res.status(upstream.status).send(errText || 'Hermes API error');
    }

    const sessionId = upstream.headers.get('x-hermes-session-id');
    if (sessionId) res.setHeader('X-Hermes-Session-Id', sessionId);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = upstream.body.getReader();
    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) { res.end(); return; }
        res.write(value);
      }
    };

    req.on('close', () => reader.cancel());
    await pump();
  } catch (err) {
    if (!res.headersSent) {
      res.status(502).json({ error: `Cannot connect to Hermes API at ${HERMES_API}: ${err.message}` });
    }
  }
});

router.get('/models', async (_req, res) => {
  try {
    const headers = {};
    if (API_KEY) headers['Authorization'] = `Bearer ${API_KEY}`;
    const upstream = await fetch(`${HERMES_API}/v1/models`, { headers });
    const data = await upstream.json();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: `Cannot connect to Hermes API: ${err.message}` });
  }
});

export default router;
