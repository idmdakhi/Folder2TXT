import { describe, expect, it } from 'vitest';
import { CommentRemover } from '../../../src/features/formatter/comment-remover.js';
import { WhitespaceFormatter } from '../../../src/features/formatter/whitespace.js';

describe('CommentRemover', () => {
  it('removes block comments', () => {
    const formatter = new CommentRemover({ style: 'slash' });
    const input = 'hello /* world */ goodbye';
    expect(formatter.format(input)).toBe('hello  goodbye');
  });

  it('removes hash comments', () => {
    const formatter = new CommentRemover({ style: 'hash' });
    const input = '# comment\nhello\n# another';
    expect(formatter.format(input)).toBe('\nhello\n');
  });
});

describe('WhitespaceFormatter', () => {
  it('trims trailing whitespace', () => {
    const formatter = new WhitespaceFormatter({ trimTrailingWhitespace: true });
    expect(formatter.format('hello   \nworld  ')).toBe('hello\nworld');
  });

  it('collapses blank lines', () => {
    const formatter = new WhitespaceFormatter({ collapseBlankLines: true });
    expect(formatter.format('a\n\n\n\nb')).toBe('a\n\nb');
  });
});
