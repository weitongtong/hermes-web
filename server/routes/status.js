import { Router } from 'express';
import fs from 'fs';
import { hermesPath } from '../utils/hermes-paths.js';
import { readYaml } from '../utils/yaml-helper.js';

const router = Router();

router.get('/', (_req, res) => {
  try {
    const configPath = hermesPath('config.yaml');
    const config = fs.existsSync(configPath) ? readYaml(configPath) : {};

    const envPath = hermesPath('.env');
    const envVars = {};
    if (fs.existsSync(envPath)) {
      for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
        const t = line.trim();
        if (!t || t.startsWith('#')) continue;
        const eq = t.indexOf('=');
        if (eq > 0) envVars[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
      }
    }

    const model = typeof config.model === 'object'
      ? config.model
      : { default: config.model || '' };

    const platforms = [];
    if (envVars.FEISHU_APP_ID) platforms.push({ name: 'Feishu', enabled: true });
    if (envVars.TELEGRAM_BOT_TOKEN) platforms.push({ name: 'Telegram', enabled: true });
    if (envVars.DISCORD_TOKEN) platforms.push({ name: 'Discord', enabled: true });
    if (envVars.SLACK_BOT_TOKEN) platforms.push({ name: 'Slack', enabled: true });
    if (envVars.API_SERVER_ENABLED?.toLowerCase() === 'true' || envVars.API_SERVER_KEY) {
      platforms.push({ name: 'API Server', enabled: true });
    }

    const skillsDir = hermesPath('skills');
    let skillCount = 0;
    if (fs.existsSync(skillsDir)) {
      const countSkills = (dir) => {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
          if (e.isDirectory()) {
            if (fs.existsSync(`${dir}/${e.name}/SKILL.md`)) skillCount++;
            else countSkills(`${dir}/${e.name}`);
          }
        }
      };
      countSkills(skillsDir);
    }

    const memoryFile = hermesPath('memories', 'MEMORY.md');
    const userFile = hermesPath('memories', 'USER.md');
    const memoryChars = fs.existsSync(memoryFile) ? fs.readFileSync(memoryFile, 'utf-8').length : 0;
    const userChars = fs.existsSync(userFile) ? fs.readFileSync(userFile, 'utf-8').length : 0;

    res.json({
      model,
      platforms,
      skillCount,
      memory: { memoryChars, memoryLimit: 2200, userChars, userLimit: 1375 },
      hermesHome: hermesPath(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
