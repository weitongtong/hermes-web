import { Router } from 'express';
import fs from 'fs';
import { hermesPath } from '../utils/hermes-paths.js';
import { readYaml, writeYaml, mergeDeep } from '../utils/yaml-helper.js';

const router = Router();

router.get('/config', (_req, res) => {
  try {
    const config = readYaml(hermesPath('config.yaml'));
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/config', (req, res) => {
  try {
    const configPath = hermesPath('config.yaml');
    const config = readYaml(configPath);
    mergeDeep(config, req.body);
    writeYaml(configPath, config);
    res.json({ success: true, message: 'Config saved. Restart hermes gateway to apply changes.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/env', (_req, res) => {
  try {
    const envPath = hermesPath('.env');
    if (!fs.existsSync(envPath)) return res.json({});
    const raw = fs.readFileSync(envPath, 'utf-8');
    const entries = {};
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx < 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      const lowerKey = key.toLowerCase();
      const isSensitive = lowerKey.includes('key') || lowerKey.includes('secret') ||
        lowerKey.includes('token') || lowerKey.includes('password');
      entries[key] = isSensitive && val ? '****' : val;
    }
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/env/:key', (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    if (typeof value !== 'string') return res.status(400).json({ error: 'value must be a string' });

    const envPath = hermesPath('.env');
    let lines = [];
    if (fs.existsSync(envPath)) {
      lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    }

    let found = false;
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx < 0) continue;
      if (trimmed.slice(0, eqIdx).trim() === key) {
        lines[i] = `${key}=${value}`;
        found = true;
        break;
      }
    }
    if (!found) lines.push(`${key}=${value}`);

    fs.writeFileSync(envPath, lines.join('\n'), 'utf-8');
    res.json({ success: true, message: 'Env updated. Restart hermes gateway to apply changes.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
