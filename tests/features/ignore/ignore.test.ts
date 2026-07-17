import { describe, expect, it } from 'vitest';
import { IgnoreEngine } from '../../../src/features/ignore/ignore-engine.js';
import type { IgnoreRule } from '../../../src/features/ignore/ignore-rule.js';

describe('IgnoreEngine', () => {
  it('ignores excluded paths', () => {
    const rules: IgnoreRule[] = [
      {
        pattern: 'node_modules/**',
        type: 'exclude',
        caseSensitive: true,
        directoryOnly: false,
        anchored: false,
      },
    ];
    const engine = new IgnoreEngine(rules);
    expect(engine.ignores('node_modules/package/index.js')).toBe(true);
    expect(engine.ignores('src/index.js')).toBe(false);
  });

  it('supports include override', () => {
    const rules: IgnoreRule[] = [
      {
        pattern: '*.ts',
        type: 'exclude',
        caseSensitive: true,
        directoryOnly: false,
        anchored: false,
      },
      {
        pattern: 'main.ts',
        type: 'include',
        caseSensitive: true,
        directoryOnly: false,
        anchored: false,
      },
    ];
    const engine = new IgnoreEngine(rules);
    expect(engine.ignores('main.ts')).toBe(false);
    expect(engine.ignores('other.ts')).toBe(true);
  });

  it('supports directory-only rules', () => {
    const rules: IgnoreRule[] = [
      {
        pattern: 'build',
        type: 'exclude',
        caseSensitive: true,
        directoryOnly: true,
        anchored: false,
      },
    ];
    const engine = new IgnoreEngine(rules);
    expect(engine.ignores('build', true)).toBe(true);
    expect(engine.ignores('build/file.js', false)).toBe(false);
  });

  it('supports anchored rules', () => {
    const rules: IgnoreRule[] = [
      {
        pattern: 'src',
        type: 'exclude',
        caseSensitive: true,
        directoryOnly: false,
        anchored: true,
      },
    ];
    const engine = new IgnoreEngine(rules);
    expect(engine.ignores('src/main.ts')).toBe(true);
    expect(engine.ignores('lib/src/main.ts')).toBe(false);
  });

  it('respects case sensitivity', () => {
    const rules: IgnoreRule[] = [
      {
        pattern: 'README',
        type: 'exclude',
        caseSensitive: true,
        directoryOnly: false,
        anchored: false,
      },
    ];
    const engine = new IgnoreEngine(rules);
    expect(engine.ignores('README.md')).toBe(true);
    expect(engine.ignores('readme.md')).toBe(false);
  });

  it('handles wildcard patterns', () => {
    const rules: IgnoreRule[] = [
      {
        pattern: '*.log',
        type: 'exclude',
        caseSensitive: false,
        directoryOnly: false,
        anchored: false,
      },
    ];
    const engine = new IgnoreEngine(rules);
    expect(engine.ignores('error.log')).toBe(true);
    expect(engine.ignores('logs/error.log')).toBe(true);
    expect(engine.ignores('error.txt')).toBe(false);
  });

  it('handles recursive wildcard **', () => {
    const rules: IgnoreRule[] = [
      {
        pattern: '**/temp/**',
        type: 'exclude',
        caseSensitive: false,
        directoryOnly: false,
        anchored: false,
      },
    ];
    const engine = new IgnoreEngine(rules);
    expect(engine.ignores('src/temp/file.txt')).toBe(true);
    expect(engine.ignores('temp/file.txt')).toBe(true);
    expect(engine.ignores('src/temp')).toBe(true);
  });

  it('supports adding rules immutably', () => {
    const engine1 = new IgnoreEngine();
    const engine2 = engine1.withRule({
      pattern: '*.ts',
      type: 'exclude',
      caseSensitive: false,
      directoryOnly: false,
      anchored: false,
    });
    expect(engine1.getRules()).toHaveLength(0);
    expect(engine2.getRules()).toHaveLength(1);
    expect(engine2.ignores('file.ts')).toBe(true);
  });

  it('returns correct rules list', () => {
    const rules: IgnoreRule[] = [
      {
        pattern: 'dist/**',
        type: 'exclude',
        caseSensitive: true,
        directoryOnly: false,
        anchored: false,
      },
    ];
    const engine = new IgnoreEngine(rules);
    expect(engine.getRules()).toEqual(rules);
  });
});
