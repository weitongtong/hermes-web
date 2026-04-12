import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { hermesPath } from '../utils/hermes-paths.js';

const router = Router();

function walkSkills(dir, category = '') {
  const skills = [];
  if (!fs.existsSync(dir)) return skills;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skillDir = path.join(dir, entry.name);
    const skillMd = path.join(skillDir, 'SKILL.md');
    const descMd = path.join(skillDir, 'DESCRIPTION.md');

    if (fs.existsSync(skillMd)) {
      try {
        const raw = fs.readFileSync(skillMd, 'utf-8');
        const { data: frontmatter } = matter(raw);
        skills.push({
          name: frontmatter.name || entry.name,
          slug: entry.name,
          description: frontmatter.description || '',
          category: category || 'uncategorized',
          version: frontmatter.version || '',
          tags: frontmatter.metadata?.hermes?.tags || [],
          path: skillDir,
        });
      } catch {}
    } else if (fs.existsSync(descMd) || fs.readdirSync(skillDir).some((f) => fs.statSync(path.join(skillDir, f)).isDirectory())) {
      skills.push(...walkSkills(skillDir, entry.name));
    }
  }
  return skills;
}

router.get('/', (_req, res) => {
  try {
    const skills = walkSkills(hermesPath('skills'));
    res.json(skills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:name', (req, res) => {
  try {
    const allSkills = walkSkills(hermesPath('skills'));
    const skill = allSkills.find((s) => s.slug === req.params.name || s.name === req.params.name);
    if (!skill) return res.status(404).json({ error: 'Skill not found' });

    const raw = fs.readFileSync(path.join(skill.path, 'SKILL.md'), 'utf-8');
    const { data: frontmatter, content } = matter(raw);
    res.json({ ...skill, frontmatter, content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:name/files', (req, res) => {
  try {
    const allSkills = walkSkills(hermesPath('skills'));
    const skill = allSkills.find((s) => s.slug === req.params.name || s.name === req.params.name);
    if (!skill) return res.status(404).json({ error: 'Skill not found' });

    const files = [];
    const walk = (dir, prefix = '') => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          walk(path.join(dir, entry.name), rel);
        } else if (entry.name !== 'SKILL.md') {
          files.push(rel);
        }
      }
    };
    walk(skill.path);
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
