import fs from 'fs';
import path from 'path';
// import { parse as parseYaml } from 'yaml';
import type { Repo2TxtConfig } from './config.js';

export async function loadConfigFile(
  cwd: string,
): Promise<Partial<Repo2TxtConfig> | null> {
  const candidates = [
    'repo2txt.config.json',
    'repo2txt.config.js',
    'repo2txt.config.mjs',
    'repo2txt.config.yaml',
    'repo2txt.config.yml',
  ];

  for (const file of candidates) {
    const fullPath = path.join(cwd, file);
    if (!fs.existsSync(fullPath)) continue;

    const ext = path.extname(file);
    if (ext === '.json') {
      return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
    } else if (ext === '.js' || ext === '.mjs') {
      return (await import(fullPath)).default;
    } else if (ext === '.yaml' || ext === '.yml') {
      // return parseYaml(fs.readFileSync(fullPath, 'utf-8'));
    }
  }
  return null;
}
