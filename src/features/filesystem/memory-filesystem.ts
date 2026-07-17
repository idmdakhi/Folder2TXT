import type { FileSystem, FileInfo, DirectoryEntry } from './index.js';

export class MemoryFileSystem implements FileSystem {
  private files: Map<string, string> = new Map();

  addFile(path: string, content: string): void {
    this.files.set(path, content);
  }

  async exists(path: string): Promise<boolean> {
    return this.files.has(path);
  }

  async stat(path: string): Promise<FileInfo> {
    const content = this.files.get(path);
    if (content === undefined) throw new Error(`File not found: ${path}`);
    return {
      size: Buffer.byteLength(content, 'utf8'),
      modifiedAt: new Date(),
      isDirectory: false,
      isFile: true,
      isSymbolicLink: false,
    };
  }

  async readDirectory(path: string): Promise<readonly DirectoryEntry[]> {
    const entries: DirectoryEntry[] = [];
    const prefix = path ? path + '/' : '';
    const seen = new Set<string>();
    for (const fullPath of this.files.keys()) {
      if (!fullPath.startsWith(prefix)) continue;
      const relative = fullPath.slice(prefix.length);
      const parts = relative.split('/');
      const name = parts[0];
      if (!name || seen.has(name)) continue;
      seen.add(name);
      const isDir = parts.length > 1;
      entries.push({
        name,
        path: prefix + name,
        isDirectory: isDir,
        isFile: !isDir,
        isSymbolicLink: false,
      });
    }
    return entries;
  }

  async readText(path: string, _encoding?: BufferEncoding): Promise<string> {
    const content = this.files.get(path);
    if (content === undefined) throw new Error(`File not found: ${path}`);
    return content;
  }

  createReadStream(): never {
    throw new Error('Streaming not supported in memory FS');
  }
}
