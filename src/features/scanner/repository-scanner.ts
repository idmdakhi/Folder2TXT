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
import { IgnoreEngine, parseGitIgnore } from '../ignore/index.js';
import { isBinaryFile, isBinaryExtension } from '../binary/index.js';
import { StatsCollector } from '../stats/index.js';
import { WorkerPool } from '../parallel/index.js';
import { EventEmitter } from 'node:events';
import { Repo2TxtError } from '../../shared/errors/index.js';

/**
 * رویدادهای اسکن
 */
export interface ScannerEvents {
  started: { root: string; startedAt: Date };
  fileFound: { node: RepositoryNode; index: number; total: number };
  directoryFound: { node: RepositoryNode; index: number; total: number };
  finished: { result: ScanResult };
  error: { error: Error; path?: string };
  progress: { percent: number; files: number; directories: number };
}

/**
 * اسکنر مخزن با قابلیت‌های پیشرفته
 */
export class RepositoryScanner extends EventEmitter implements Scanner {
  private total = 0;
  private files = 0;
  private directories = 0;
  private bytes = 0;
  private startedAt = new Date();
  private finishedAt = new Date();
  private statsCollector: StatsCollector | null = null;
  private ignoreEngine: IgnoreEngine | null = null;
  private pool: WorkerPool | null = null;
  private isAborted = false;
  private processedCount = 0;
  private totalEstimated = 0;

  constructor(
    private readonly filesystem: FileSystem,
    private readonly options: ScanOptions,
  ) {
    super();

    // فعال‌سازی آمار
    if (this.options.enableStats !== false) {
      this.statsCollector = new StatsCollector();
    }

    // بارگذاری .gitignore
    if (this.options.gitignore !== false) {
      this.loadGitIgnore().catch(() => {
        // خطا در بارگذاری .gitignore را نادیده بگیر
      });
    }

    // راه‌اندازی پردازش موازی
    if (this.options.concurrency && this.options.concurrency > 1) {
      this.pool = new WorkerPool({ concurrency: this.options.concurrency });
    }
  }

  /**
   * بارگذاری قواعد .gitignore
   */
  private async loadGitIgnore(): Promise<void> {
    try {
      const rules = await parseGitIgnore(this.options.root);
      if (rules.length > 0) {
        this.ignoreEngine = new IgnoreEngine(rules);
        this.emit('debug', {
          message: `Loaded ${rules.length} rules from .gitignore`,
        });
      }
    } catch (error) {
      this.emit('warning', { message: 'Failed to load .gitignore', error });
    }
  }

  /**
   * اجرای اسکن
   */
  async *scan(): AsyncIterable<RepositoryNode> {
    this.reset();
    this.startedAt = new Date();
    this.isAborted = false;

    // انتشار رویداد شروع
    this.emit('started', {
      root: this.options.root,
      startedAt: this.startedAt,
    });

    try {
      // تخمین تعداد کل فایل‌ها (برای نمایش پیشرفت)
      this.totalEstimated = await this.estimateTotal(this.options.root);

      yield* this.walk(this.options.root);

      this.finishedAt = new Date();

      // انتشار رویداد پایان
      const result = this.result();
      this.emit('finished', { result });
    } catch (error) {
      this.emit('error', {
        error: error as Error,
        path: this.options.root,
      });
      throw error;
    } finally {
      // خاموش کردن Worker Pool
      if (this.pool) {
        await this.pool.shutdown();
      }
    }
  }

  /**
   * تخمین تعداد کل فایل‌ها (برای نمایش پیشرفت)
   */
  private async estimateTotal(path: string): Promise<number> {
    try {
      let count = 0;
      const entries = await this.filesystem.readDirectory(path);
      for (const entry of entries) {
        if (entry.isDirectory) {
          count += await this.estimateTotal(entry.path);
        } else {
          count++;
        }
      }
      return count;
    } catch {
      return 0;
    }
  }

  /**
   * بازگشت نتیجه اسکن
   */
  result(): ScanResult {
    return {
      total: this.total,
      files: this.files,
      directories: this.directories,
      bytes: this.bytes,
      startedAt: this.startedAt,
      finishedAt: this.finishedAt,
      durationMs: this.finishedAt.getTime() - this.startedAt.getTime(),
      stats: this.statsCollector?.toJSON(),
    };
  }

  /**
   * پیمایش بازگشتی پوشه‌ها
   */
  private async *walk(currentPath: string): AsyncGenerator<RepositoryNode> {
    // بررسی Abort
    if (this.isAborted || this.options.signal?.aborted) {
      this.isAborted = true;
      throw new Repo2TxtError('Scan aborted by user', { code: 'SCAN_ABORTED' });
    }

    let entries;
    try {
      entries = await this.filesystem.readDirectory(currentPath);
    } catch (error) {
      this.emit('error', {
        error: error as Error,
        path: currentPath,
      });
      return;
    }

    for (const entry of entries) {
      // بررسی Abort
      if (this.isAborted || this.options.signal?.aborted) {
        this.isAborted = true;
        throw new Repo2TxtError('Scan aborted', { code: 'SCAN_ABORTED' });
      }

      // فیلتر فایل‌های مخفی
      if (!this.options.includeHidden && this.isHidden(entry.name)) {
        continue;
      }

      // دنبال کردن لینک‌های سمبلیک
      if (entry.isSymbolicLink && !this.options.followSymlinks) {
        continue;
      }

      // ایجاد Node
      let node: RepositoryNode;
      try {
        node = await this.createNode(entry);
      } catch (error) {
        this.emit('error', {
          error: error as Error,
          path: entry.path,
        });
        continue;
      }

      // اعمال قواعد Ignore
      if (this.shouldIgnore(node)) {
        continue;
      }

      // اعمال الگوهای Include/Exclude
      if (!this.shouldInclude(node)) {
        continue;
      }

      this.total++;
      this.processedCount++;

      // به‌روزرسانی آمار
      if (node.kind === NodeKind.File) {
        this.files++;
        this.bytes += node.size;

        // تشخیص فایل باینری
        if (this.options.detectBinary !== false) {
          const isBinary = await this.isBinaryFile(node);
          if (isBinary) {
            // فایل باینری را نادیده بگیر
            continue;
          }
        }

        // جمع‌آوری آمار
        if (this.statsCollector) {
          this.statsCollector.addNode(node);
        }

        // انتشار رویداد یافتن فایل
        this.emit('fileFound', {
          node,
          index: this.files,
          total: this.totalEstimated,
        });
      }

      if (node.kind === NodeKind.Directory) {
        this.directories++;

        // انتشار رویداد یافتن پوشه
        this.emit('directoryFound', {
          node,
          index: this.directories,
          total: this.totalEstimated,
        });
      }

      // انتشار رویداد پیشرفت
      if (this.totalEstimated > 0) {
        const percent = (this.processedCount / this.totalEstimated) * 100;
        this.emit('progress', {
          percent: Math.min(percent, 100),
          files: this.files,
          directories: this.directories,
        });
      }

      yield node;

      // پیمایش زیرپوشه‌ها
      if (node.kind === NodeKind.Directory) {
        yield* this.walk(entry.path);
      }
    }
  }

  /**
   * ایجاد گره مخزن
   */
  private async createNode(entry: any): Promise<RepositoryNode> {
    let info;
    try {
      info = await this.filesystem.stat(entry.path);
    } catch (error) {
      throw new Repo2TxtError(`Cannot stat file: ${entry.path}`, {
        code: 'FILESYSTEM_STAT_FAILED',
        cause: error,
        details: { path: entry.path },
      });
    }
    const nodePath = relative(this.options.root, entry.path);

    return {
      id: createStableId(nodePath),
      kind: entry.isDirectory ? NodeKind.Directory : NodeKind.File,
      name: basename(entry.path),
      path: nodePath || '.',
      parent: dirname(nodePath) || null,
      absolutePath: entry.path,
      size: info.size,
      modifiedAt: info.modifiedAt,
      extension: entry.isFile ? extension(entry.name) : '',
    };
  }

  /**
   * بررسی نادیده‌گیری
   */
  private shouldIgnore(node: RepositoryNode): boolean {
    // اول از ignoreEngine (از .gitignore) استفاده می‌کنیم
    if (this.ignoreEngine) {
      if (
        this.ignoreEngine.ignores(node.path, node.kind === NodeKind.Directory)
      ) {
        return true;
      }
    }

    // سپس از ignoreEngine در options استفاده می‌کنیم
    if (this.options.ignoreEngine) {
      if (
        this.options.ignoreEngine.ignores(
          node.path,
          node.kind === NodeKind.Directory,
        )
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * بررسی الگوهای Include/Exclude
   */
  private shouldInclude(node: RepositoryNode): boolean {
    // اگر هیچ الگویی تعیین نشده، همه را شامل کن
    if (!this.options.includePatterns && !this.options.excludePatterns) {
      return true;
    }

    const glob = this.options.glob || new GlobMatcher();
    const path = node.path;

    // اگر includePatterns وجود داشته باشد، باید حداقل یکی تطابق داشته باشد
    if (
      this.options.includePatterns &&
      this.options.includePatterns.length > 0
    ) {
      if (!glob.matchesAny(path, this.options.includePatterns)) {
        return false;
      }
    }

    // اگر excludePatterns وجود داشته باشد، اگر هر کدام تطابق داشت، رد می‌شود
    if (
      this.options.excludePatterns &&
      this.options.excludePatterns.length > 0
    ) {
      if (glob.matchesAny(path, this.options.excludePatterns)) {
        return false;
      }
    }

    return true;
  }

  /**
   * تشخیص فایل باینری
   */
  private async isBinaryFile(node: RepositoryNode): Promise<boolean> {
    // بررسی پسوند
    if (isBinaryExtension(node.extension)) {
      return true;
    }

    // بررسی محتوا (فقط برای فایل‌های کوچک)
    const maxCheckSize = this.options.maxBinaryCheckSize ?? 1024 * 1024 * 10; // 10MB
    if (node.size > 0 && node.size < maxCheckSize) {
      try {
        return await isBinaryFile(node.absolutePath);
      } catch {
        // در صورت خطا، فرض کنیم باینری نیست
      }
    }

    return false;
  }

  /**
   * تشخیص فایل مخفی
   */
  private isHidden(name: string): boolean {
    return name.startsWith('.');
  }

  /**
   * بازنشانی آمار
   */
  private reset(): void {
    this.total = 0;
    this.files = 0;
    this.directories = 0;
    this.bytes = 0;
    this.processedCount = 0;
    this.isAborted = false;
    this.totalEstimated = 0;
  }

  /**
   * خواندن محتوای فایل با پردازش موازی
   */
  async readFileContent(node: RepositoryNode): Promise<string | null> {
    // بررسی حجم فایل
    if (this.options.maxFileSize && node.size > this.options.maxFileSize) {
      return null;
    }

    if (!this.pool) {
      try {
        return await this.filesystem.readText(node.absolutePath);
      } catch {
        return null;
      }
    }

    try {
      const result = await this.pool.execute({
        path: node.absolutePath,
        encoding: 'utf8',
        maxSize: this.options.maxFileSize,
      });
      return (result as any).content;
    } catch {
      return null;
    }
  }

  /**
   * خواندن محتوای چند فایل به‌صورت موازی
   */
  async readMultipleFiles(
    nodes: RepositoryNode[],
  ): Promise<Map<string, string | null>> {
    const results = new Map<string, string | null>();

    if (!this.pool) {
      for (const node of nodes) {
        const content = await this.readFileContent(node);
        results.set(node.path, content);
      }
      return results;
    }

    const promises = nodes.map(async (node) => {
      const content = await this.readFileContent(node);
      return { path: node.path, content };
    });

    const resolved = await Promise.all(promises);
    for (const { path, content } of resolved) {
      results.set(path, content);
    }

    return results;
  }

  /**
   * متوقف کردن اسکن
   */
  abort(): void {
    this.isAborted = true;
    this.emit('aborted', { message: 'Scan aborted by user' });
    throw new Repo2TxtError('Scan aborted', { code: 'SCAN_ABORTED' });
  }
}
