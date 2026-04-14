import { Router } from 'express';
import fs from 'fs';
import { hermesPath } from '../utils/hermes-paths.js';
import { logger } from '../utils/logger.js';

const router = Router();

router.get('/', (_req, res) => {
  try {
    const filePath = hermesPath('channel_directory.json');
    if (!fs.existsSync(filePath)) {
      return res.json({ platforms: {} });
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.json({ platforms: data.platforms || {} });
  } catch (err) {
    logger.error('channels', 'Failed to read channel_directory.json', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
