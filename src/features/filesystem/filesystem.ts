import type { Readable } from 'node:stream';
import type { DirectoryEntry } from './directory-entry.js';
import type { FileInfo } from './file-info.js';

export interface FileSystem {
  exists(path: string): Promise<boolean>;
  stat(path: string): Promise<FileInfo>;
  readDirectory(path: string): Promise<readonly DirectoryEntry[]>;
  readText(path: string, encoding?: BufferEncoding): Promise<string>;
  createReadStream(path: string, encoding?: BufferEncoding): Readable;
}
