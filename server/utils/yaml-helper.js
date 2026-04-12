import fs from 'fs';
import yaml from 'js-yaml';

export function readYaml(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return yaml.load(raw) || {};
}

export function writeYaml(filePath, data) {
  const content = yaml.dump(data, { lineWidth: 120, noRefs: true });
  fs.writeFileSync(filePath, content, 'utf-8');
}

export function mergeDeep(target, source) {
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      mergeDeep(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}
