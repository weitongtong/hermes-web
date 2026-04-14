import { Router } from 'express';
import { logger } from '../utils/logger.js';

const router = Router();

const HERMES_API = process.env.HERMES_API_URL || 'http://localhost:8642';
const API_KEY = process.env.API_SERVER_KEY || '';

function authHeaders(contentType = false) {
  const h = {};
  if (contentType) h['Content-Type'] = 'application/json';
  if (API_KEY) h['Authorization'] = `Bearer ${API_KEY}`;
  return h;
}

async function proxy(res, url, options = {}) {
  try {
    const upstream = await fetch(url, options);
    const body = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    res.send(body);
  } catch (err) {
    logger.error('jobs', `Upstream proxy failed: ${url}`, err);
    res.status(502).json({ error: `Cannot connect to Hermes API: ${err.message}` });
  }
}

router.get('/', (_req, res) => {
  const qs = _req.query.include_disabled ? '?include_disabled=true' : '';
  proxy(res, `${HERMES_API}/api/jobs${qs}`, { headers: authHeaders() });
});

router.post('/', async (req, res) => {
  proxy(res, `${HERMES_API}/api/jobs`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(req.body),
  });
});

router.get('/:id', (req, res) => {
  proxy(res, `${HERMES_API}/api/jobs/${req.params.id}`, { headers: authHeaders() });
});

router.patch('/:id', async (req, res) => {
  proxy(res, `${HERMES_API}/api/jobs/${req.params.id}`, {
    method: 'PATCH',
    headers: authHeaders(true),
    body: JSON.stringify(req.body),
  });
});

router.delete('/:id', (req, res) => {
  proxy(res, `${HERMES_API}/api/jobs/${req.params.id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
});

router.post('/:id/pause', (req, res) => {
  proxy(res, `${HERMES_API}/api/jobs/${req.params.id}/pause`, {
    method: 'POST',
    headers: authHeaders(),
  });
});

router.post('/:id/resume', (req, res) => {
  proxy(res, `${HERMES_API}/api/jobs/${req.params.id}/resume`, {
    method: 'POST',
    headers: authHeaders(),
  });
});

router.post('/:id/run', (req, res) => {
  proxy(res, `${HERMES_API}/api/jobs/${req.params.id}/run`, {
    method: 'POST',
    headers: authHeaders(),
  });
});

export default router;
