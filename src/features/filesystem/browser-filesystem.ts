import type { FileSystem, FileInfo, DirectoryEntry } from './index.js';

/**
 * پیاده‌سازی برای مرورگر با استفاده از File API
 * (برای پردازش پوشه‌های آپلود شده)
 */
export class BrowserFileSystem implements FileSystem {
  private fileMap: Map<string, File> = new Map();

  constructor(files: FileList) {
    // تبدیل FileList به آرایه با حلقه سنتی
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const path = (file as any).webkitRelativePath || file.name;
      this.fileMap.set(path, file);
    }
  }

  async exists(path: string): Promise<boolean> {
    return this.fileMap.has(path);
  }

  async stat(path: string): Promise<FileInfo> {
    const file = this.fileMap.get(path);
    if (!file) throw new Error(`File not found: ${path}`);
    return {
      size: file.size,
      modifiedAt: new Date(file.lastModified),
      isDirectory: false, // در File API همه فایل هستند
      isFile: true,
      isSymbolicLink: false,
    };
  }

  async readDirectory(path: string): Promise<readonly DirectoryEntry[]> {
    const entries: DirectoryEntry[] = [];
    const prefix = path ? path + '/' : '';
    const seen = new Set<string>();
    for (const [fullPath] of this.fileMap) {
      if (!fullPath.startsWith(prefix)) continue;
      const relative = fullPath.slice(prefix.length);
      const parts = relative.split('/');
      const name = parts[0];
      if (!name) continue;
      if (seen.has(name)) continue;
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

  async readText(
    path: string,
    encoding: BufferEncoding = 'utf8',
  ): Promise<string> {
    const file = this.fileMap.get(path);
    if (!file) throw new Error(`File not found: ${path}`);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file, encoding);
    });
  }

  createReadStream(): never {
    throw new Error('Streaming not supported in browser');
  }
}
