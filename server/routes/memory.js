import { Router } from 'express';
import fs from 'fs';
import { hermesPath } from '../utils/hermes-paths.js';
import { logger } from '../utils/logger.js';

const router = Router();
const ENTRY_DELIMITER = '\n§\n';
const CHAR_LIMITS = { memory: 2200, user: 1375 };

router.get('/:target', (req, res) => {
  const target = req.params.target;
  if (!['memory', 'user'].includes(target)) {
    return res.status(400).json({ error: 'Target must be "memory" or "user"' });
  }

  const filename = target === 'memory' ? 'MEMORY.md' : 'USER.md';
  const filePath = hermesPath('memories', filename);

  try {
    if (!fs.existsSync(filePath)) {
      return res.json({ entries: [], charCount: 0, charLimit: CHAR_LIMITS[target] });
    }

    const raw = fs.readFileSync(filePath, 'utf-8');
    const entries = raw.split(ENTRY_DELIMITER).map((e) => e.trim()).filter(Boolean);
    res.json({
      entries,
      charCount: raw.length,
      charLimit: CHAR_LIMITS[target],
    });
  } catch (err) {
    logger.error('memory', `Failed to read ${req.params.target}`, err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
