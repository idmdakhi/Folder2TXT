import type { Formatter } from './formatter.js';

export type CommentStyle = 'slash' | 'hash' | 'auto';

export interface CommentRemoverOptions {
  style?: CommentStyle;
}

export class CommentRemover implements Formatter {
  constructor(private readonly options: CommentRemoverOptions = {}) {}

  format(content: string): string {
    const style = this.options.style ?? 'auto';
    let result = content;
    if (style === 'slash' || style === 'auto') {
      result = this.removeSlashComments(result);
    }
    if (style === 'hash' || style === 'auto') {
      result = this.removeHashComments(result);
    }
    return result;
  }

  private removeSlashComments(content: string): string {
    return content.replace(/\/\*[\s\S]*?\*\//g, '');
  }

  private removeHashComments(content: string): string {
    return content.replace(/^\s*#.*$/gm, '');
  }
}
