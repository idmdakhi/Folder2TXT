import type { Formatter } from './formatter.js';

export interface WhitespaceOptions {
  trimTrailingWhitespace?: boolean;
  removeBlankLines?: boolean;
  collapseBlankLines?: boolean;
}

export class WhitespaceFormatter implements Formatter {
  constructor(private readonly options: WhitespaceOptions = {}) {}

  format(content: string): string {
    let result = content;
    if (this.options.trimTrailingWhitespace) {
      result = result.replace(/[ \t]+$/gm, '');
    }
    if (this.options.removeBlankLines) {
      result = result.replace(/^\s*\n/gm, '');
    }
    if (this.options.collapseBlankLines) {
      result = result.replace(/\n{3,}/g, '\n\n');
    }
    return result;
  }
}
