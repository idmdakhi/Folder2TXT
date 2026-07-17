import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RunRepo2TxtUseCase } from '@/app/run.use-case.js';
import type { Repo2TxtConfig } from '@/features/config/index.js';

describe('RunRepo2TxtUseCase', () => {
  let root: string;
  let output: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'repo2txt-e2e-'));
    output = join(root, 'result.txt');
    await writeFile(join(root, 'main.ts'), 'console.log("hello");');
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('generates repository export file', async () => {
    const config: Repo2TxtConfig = {
      root,
      output,
      format: 'txt',
      encoding: 'utf8',
      renderTree: true,
      includeHidden: false,
      followSymlinks: false,
      include: ['**/*'],
      exclude: ['node_modules/**'],
      maxFileSize: 5 * 1024 * 1024,
      detectBinary: true,
      includeStatistics: true,
      removeComments: false,
      removeBlankLines: false,
      trimTrailingWhitespace: false,
      collapseBlankLines: false,
      preserveFileOrder: false,
      concurrency: 4,
      failFast: true,
      bom: false,
    };
    const useCase = new RunRepo2TxtUseCase(config);
    await useCase.execute();
    const content = await readFile(output, 'utf8');
    expect(content).toContain('main.ts');
  });
});
