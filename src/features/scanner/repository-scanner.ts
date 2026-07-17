import { NodeKind, type RepositoryNode } from '../../core/domain/index.js';
import {
  createStableId,
  basename,
  dirname,
  extension,
  relative,
} from '../../shared/utils/index.js';
import type { FileSystem } from '../filesystem/index.js';
import type { Scanner, ScanOptions, ScanResult } from './index.js';
import { GlobMatcher } from '../glob/index.js';

export class RepositoryScanner implements Scanner {
  private total = 0;
  private files = 0;
  private directories = 0;
  private bytes = 0;
  private startedAt = new Date();
  private finishedAt = new Date();

  constructor(
    private readonly filesystem: FileSystem,
    private readonly options: ScanOptions,
  ) {}

  async *scan(): AsyncIterable<RepositoryNode> {
    this.reset();
    this.startedAt = new Date();
    yield* this.walk(this.options.root);
    this.finishedAt = new Date();
  }

  result(): ScanResult {
    return {
      total: this.total,
      files: this.files,
      directories: this.directories,
      bytes: this.bytes,
      startedAt: this.startedAt,
      finishedAt: this.finishedAt,
    };
  }

  private async *walk(currentPath: string): AsyncGenerator<RepositoryNode> {
    if (this.options.signal?.aborted) return;
    const entries = await this.filesystem.readDirectory(currentPath);
    for (const entry of entries) {
      if (this.options.signal?.aborted) return;
      if (!this.options.includeHidden && this.isHidden(entry.name)) continue;
      if (entry.isSymbolicLink && !this.options.followSymlinks) continue;
      const node = await this.createNode(entry);
      this.total++;
      if (node.kind === NodeKind.File) {
        this.files++;
        this.bytes += node.size;
      }
      if (node.kind === NodeKind.Directory) this.directories++;
      if (!this.shouldInclude(node)) continue;
      yield node;
      if (node.kind === NodeKind.Directory) {
        yield* this.walk(entry.path);
      }
    }
  }

  // متد shouldInclude:
  private shouldInclude(node: RepositoryNode): boolean {
    if (!this.options.includePatterns && !this.options.excludePatterns)
      return true;
    const glob = this.options.glob || new GlobMatcher();
    const path = node.path;
    // اگر includePatterns وجود داشته باشد، باید حداقل یکی تطابق داشته باشد
    if (
      this.options.includePatterns &&
      this.options.includePatterns.length > 0
    ) {
      if (!glob.matchesAny(path, this.options.includePatterns)) return false;
    }
    // اگر excludePatterns وجود داشته باشد، اگر هر کدام تطابق داشت، رد می‌شود
    if (
      this.options.excludePatterns &&
      this.options.excludePatterns.length > 0
    ) {
      if (glob.matchesAny(path, this.options.excludePatterns)) return false;
    }
    // همچنین اگر ignoreEngine داده شده باشد، از آن استفاده می‌کنیم
    if (this.options.ignoreEngine) {
      if (
        this.options.ignoreEngine.ignores(
          path,
          node.kind === NodeKind.Directory,
        )
      )
        return false;
    }
    return true;
  }

  private async createNode(entry: any): Promise<RepositoryNode> {
    const info = await this.filesystem.stat(entry.path);
    const nodePath = relative(this.options.root, entry.path);
    return {
      id: createStableId(nodePath),
      kind: entry.isDirectory ? NodeKind.Directory : NodeKind.File,
      name: basename(entry.path),
      path: nodePath,
      parent: dirname(nodePath) || null,
      absolutePath: entry.path,
      size: info.size,
      modifiedAt: info.modifiedAt,
      extension: entry.isFile ? extension(entry.name) : '',
    };
  }

  private isHidden(name: string): boolean {
    return name.startsWith('.');
  }

  private reset(): void {
    this.total = 0;
    this.files = 0;
    this.directories = 0;
    this.bytes = 0;
  }
}
