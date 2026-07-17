import { describe, expect, it } from 'vitest';
import {
  normalizePath,
  basename,
  dirname,
  extension,
  join,
  relative,
  split,
} from '../../../src/shared/utils/path.js';
import { createStableId } from '../../../src/shared/utils/stable-id.js';

describe('path utilities', () => {
  it('normalizes paths', () => {
    expect(normalizePath('src\\app\\main.ts')).toBe('src/app/main.ts');
    expect(normalizePath('src//app///main.ts')).toBe('src/app/main.ts');
  });

  it('returns basename', () => {
    expect(basename('src/app/main.ts')).toBe('main.ts');
    expect(basename('main.ts')).toBe('main.ts');
  });

  it('returns dirname', () => {
    expect(dirname('src/app/main.ts')).toBe('src/app');
    expect(dirname('main.ts')).toBe('');
  });

  it('returns extension', () => {
    expect(extension('main.ts')).toBe('ts');
    expect(extension('README.md')).toBe('md');
    expect(extension('file')).toBe('');
  });

  it('joins paths', () => {
    expect(join('src', 'app', 'main.ts')).toBe('src/app/main.ts');
    expect(join('', 'src', '')).toBe('src');
  });

  it('calculates relative path', () => {
    expect(relative('src', 'src/app/main.ts')).toBe('app/main.ts');
    expect(relative('src', 'lib/main.ts')).toBe('lib/main.ts');
  });

  it('splits path', () => {
    expect(split('src/app/main.ts')).toEqual(['src', 'app', 'main.ts']);
  });
});

describe('stable-id', () => {
  it('generates deterministic IDs', () => {
    const id1 = createStableId('src/main.ts');
    const id2 = createStableId('src/main.ts');
    const id3 = createStableId('src/other.ts');
    expect(id1).toBe(id2);
    expect(id1).not.toBe(id3);
  });

  it('returns 8-character hex string', () => {
    const id = createStableId('test');
    expect(id).toMatch(/^[0-9a-f]{8}$/);
  });
});
