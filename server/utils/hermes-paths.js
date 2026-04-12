import os from 'os';
import path from 'path';

export function getHermesHome() {
  return process.env.HERMES_HOME || path.join(os.homedir(), '.hermes');
}

export function hermesPath(...segments) {
  return path.join(getHermesHome(), ...segments);
}
