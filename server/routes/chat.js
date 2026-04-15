import { Router } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';

const router = Router();

const HERMES_API = process.env.HERMES_API_URL || 'http://localhost:8642';
const API_KEY = process.env.API_SERVER_KEY || '';

function createWebSessionId() {
  return `web-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
}

router.post('/chat', async (req, res) => {
  const headers = { 'Content-Type': 'application/json' };
  if (API_KEY) headers['Authorization'] = `Bearer ${API_KEY}`;
  const requestedSessionId = req.headers['x-hermes-session-id'];
  if (requestedSessionId) {
    headers['X-Hermes-Session-Id'] = requestedSessionId;
  } else if (API_KEY) {
    // This web client expects every "new chat" click to create a distinct
    // session. Without an explicit session ID, Hermes derives one from the
    // first user message and may accidentally reopen an older conversation.
    headers['X-Hermes-Session-Id'] = createWebSessionId();
  }

  try {
    const upstream = await fetch(`${HERMES_API}/v1/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...req.body, stream: true }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => '');
      logger.warn('chat', `Upstream ${upstream.status}: ${errText || 'no body'}`);
      return res.status(upstream.status).send(errText || 'Hermes API error');
    }

    const sessionId = upstream.headers.get('x-hermes-session-id');
    if (sessionId) {
      res.setHeader('X-Hermes-Session-Id', sessionId);
      logger.info('chat', `Session: ${sessionId}`);
    }

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
    logger.error('chat', `Upstream connection failed (${HERMES_API})`, err);
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
    logger.error('chat', `Failed to fetch models from ${HERMES_API}`, err);
    res.status(502).json({ error: `Cannot connect to Hermes API: ${err.message}` });
  }
});

export default router;
