import { writeFile } from 'node:fs/promises';
import type { Writer } from './writer.js';

export interface TextWriterOptions {
  encoding?: BufferEncoding;
}

export class TextWriter implements Writer {
  constructor(private readonly options: TextWriterOptions = {}) {}

  async write(path: string, content: string): Promise<void> {
    await writeFile(path, content, {
      encoding: this.options.encoding ?? 'utf8',
    });
  }
}
