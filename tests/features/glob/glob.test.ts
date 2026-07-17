import { describe, expect, it } from 'vitest';
import { GlobMatcher } from '../../../src/features/glob/glob-matcher.js';

describe('GlobMatcher', () => {
  const matcher = new GlobMatcher();

  it('matches wildcard *', () => {
    expect(matcher.matches('src/main.ts', 'src/*.ts')).toBe(true);
    expect(matcher.matches('src/main.js', 'src/*.ts')).toBe(false);
  });

  it('matches recursive **', () => {
    expect(matcher.matches('src/features/core/index.ts', 'src/**/*.ts')).toBe(
      true,
    );
    expect(matcher.matches('lib/index.ts', 'src/**/*.ts')).toBe(false);
  });

  it('matches single character ?', () => {
    expect(matcher.matches('file1.ts', 'file?.ts')).toBe(true);
    expect(matcher.matches('file12.ts', 'file?.ts')).toBe(false);
  });

  it('handles multiple patterns', () => {
    expect(matcher.matchesAny('src/main.ts', ['*.js', '*.ts'])).toBe(true);
    expect(matcher.matchesAny('src/main.js', ['*.js', '*.ts'])).toBe(true);
    expect(matcher.matchesAny('README.md', ['*.js', '*.ts'])).toBe(false);
  });
});
