import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RepositoryScanner } from '../../../src/features/scanner/repository-scanner.js';
import { NodeFileSystem } from '../../../src/infrastructure/filesystem/node-filesystem.js';

describe('RepositoryScanner', () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'repo2txt-test-'));
    await mkdir(join(root, 'src'));
    await writeFile(join(root, 'README.md'), '# Test');
    await writeFile(join(root, 'src', 'main.ts'), 'console.log("test");');
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('scans repository files', async () => {
    const scanner = new RepositoryScanner(new NodeFileSystem(), { root });
    const nodes = [];
    for await (const node of scanner.scan()) {
      nodes.push(node);
    }
    expect(nodes.length).toBeGreaterThan(0);
    expect(nodes.some((n) => n.name === 'README.md')).toBe(true);
    expect(nodes.some((n) => n.name === 'main.ts')).toBe(true);
  });

  it('returns scan statistics', async () => {
    const scanner = new RepositoryScanner(new NodeFileSystem(), { root });
    for await (const _ of scanner.scan()) {
    }
    const result = scanner.result();
    expect(result.files).toBe(2);
    expect(result.directories).toBe(1);
    expect(result.total).toBe(3);
  });

  it('filters hidden files', async () => {
    await writeFile(join(root, '.hidden'), 'secret');
    const scanner = new RepositoryScanner(new NodeFileSystem(), {
      root,
      includeHidden: false,
    });
    const nodes = [];
    for await (const node of scanner.scan()) {
      nodes.push(node);
    }
    expect(nodes.some((n) => n.name === '.hidden')).toBe(false);
  });
});
