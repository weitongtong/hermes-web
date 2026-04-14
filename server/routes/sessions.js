import { Router } from 'express';
import fs from 'fs';
import Database from 'better-sqlite3';
import { hermesPath } from '../utils/hermes-paths.js';
import { logger } from '../utils/logger.js';

const router = Router();

function getDb() {
  const dbPath = hermesPath('state.db');
  if (!fs.existsSync(dbPath)) {
    logger.warn('sessions', 'state.db not found');
    return null;
  }
  return new Database(dbPath);
}

router.get('/', (req, res) => {
  try {
    const db = getDb();
    if (!db) return res.json([]);
    const limit = parseInt(req.query.limit) || 50;
    const source = req.query.source || '';

    let sql = 'SELECT id, source, model, title, message_count, started_at, ended_at, input_tokens, output_tokens, estimated_cost_usd FROM sessions';
    const params = [];

    if (source) {
      sql += ' WHERE source = ?';
      params.push(source);
    }

    sql += ' ORDER BY started_at DESC LIMIT ?';
    params.push(limit);

    const sessions = db.prepare(sql).all(...params);
    db.close();
    res.json(sessions);
  } catch (err) {
    logger.error('sessions', 'Failed to list sessions', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/search', (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.json([]);
    const db = getDb();
    if (!db) return res.json([]);
    const sanitized = q.replace(/[^\w\s\u4e00-\u9fff]/g, ' ').trim();
    if (!sanitized) { db.close(); return res.json([]); }

    const results = db.prepare(`
      SELECT m.id, m.session_id, m.role,
             snippet(messages_fts, 0, '>>>', '<<<', '...', 40) AS snippet,
             m.timestamp,
             s.title, s.model
      FROM messages_fts
      JOIN messages m ON m.id = messages_fts.rowid
      JOIN sessions s ON s.id = m.session_id
      WHERE messages_fts MATCH ?
      ORDER BY rank
      LIMIT 30
    `).all(sanitized);
    db.close();
    res.json(results);
  } catch (err) {
    logger.error('sessions', `FTS search failed for "${req.query.q}"`, err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    if (!db) return res.status(404).json({ error: 'Session not found' });
    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
    if (!session) { db.close(); return res.status(404).json({ error: 'Session not found' }); }
    const messages = db.prepare(
      'SELECT id, role, content, tool_call_id, tool_calls, tool_name, timestamp, finish_reason FROM messages WHERE session_id = ? ORDER BY timestamp'
    ).all(req.params.id);
    db.close();
    res.json({ session, messages });
  } catch (err) {
    logger.error('sessions', `Failed to get session ${req.params.id}`, err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    if (!db) return res.status(404).json({ error: 'Session not found' });

    const session = db.prepare('SELECT id FROM sessions WHERE id = ?').get(req.params.id);
    if (!session) { db.close(); return res.status(404).json({ error: 'Session not found' }); }

    const deleteSession = db.transaction((id) => {
      db.prepare('UPDATE sessions SET parent_session_id = NULL WHERE parent_session_id = ?').run(id);
      db.prepare('DELETE FROM messages WHERE session_id = ?').run(id);
      db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
    });

    deleteSession(req.params.id);
    db.close();
    logger.info('sessions', `Deleted session ${req.params.id}`);
    res.json({ ok: true });
  } catch (err) {
    logger.error('sessions', `Failed to delete session ${req.params.id}`, err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
