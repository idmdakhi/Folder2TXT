import type { RepositoryNode } from '../../core/domain/index.js';
import { detectLanguage, type LanguageInfo } from './language-detector.js';

export interface RepoStats {
  totalFiles: number;
  totalDirectories: number;
  totalSize: number; // bytes
  totalLines: number;
  languages: Map<string, LanguageStats>;
  extensionStats: Map<string, ExtensionStats>;
  largestFiles: RepositoryNode[];
  oldestFiles: RepositoryNode[];
  newestFiles: RepositoryNode[];
}

export interface LanguageStats {
  language: LanguageInfo;
  fileCount: number;
  lineCount: number;
  totalSize: number;
}

export interface ExtensionStats {
  extension: string;
  fileCount: number;
  totalSize: number;
  totalLines: number;
}

export class StatsCollector {
  private stats: RepoStats;

  constructor() {
    this.stats = {
      totalFiles: 0,
      totalDirectories: 0,
      totalSize: 0,
      totalLines: 0,
      languages: new Map(),
      extensionStats: new Map(),
      largestFiles: [],
      oldestFiles: [],
      newestFiles: [],
    };
  }

  public addNode(node: RepositoryNode): void {
    if (node.kind === 'directory') {
      this.stats.totalDirectories++;
      return;
    }

    this.stats.totalFiles++;
    this.stats.totalSize += node.size;

    // تشخیص زبان
    const language = detectLanguage(node.name);
    this.updateLanguageStats(language, node);

    // آمار پسوند
    this.updateExtensionStats(node.extension, node);

    // بزرگترین فایل‌ها
    this.updateLargestFiles(node);

    // قدیمی‌ترین و جدیدترین فایل‌ها
    this.updateDateStats(node);
  }

  private updateLanguageStats(
    language: LanguageInfo,
    node: RepositoryNode,
  ): void {
    const existing = this.stats.languages.get(language.name);
    if (existing) {
      existing.fileCount++;
      existing.totalSize += node.size;
    } else {
      this.stats.languages.set(language.name, {
        language,
        fileCount: 1,
        lineCount: 0,
        totalSize: node.size,
      });
    }
  }

  public addLines(lines: number, fileName: string): void {
    this.stats.totalLines += lines;

    // به‌روزرسانی خطوط برای زبان
    const language = detectLanguage(fileName);
    const existing = this.stats.languages.get(language.name);
    if (existing) {
      existing.lineCount += lines;
    }
  }

  private updateExtensionStats(ext: string, node: RepositoryNode): void {
    const key = ext || 'no-extension';
    const existing = this.stats.extensionStats.get(key);
    if (existing) {
      existing.fileCount++;
      existing.totalSize += node.size;
    } else {
      this.stats.extensionStats.set(key, {
        extension: key,
        fileCount: 1,
        totalSize: node.size,
        totalLines: 0,
      });
    }
  }

  private updateLargestFiles(node: RepositoryNode): void {
    const files = this.stats.largestFiles;
    if (files.length < 10) {
      files.push(node);
      files.sort((a, b) => b.size - a.size);
    } else if (node.size > files[files.length - 1]?.size) {
      files.pop();
      files.push(node);
      files.sort((a, b) => b.size - a.size);
    }
  }

  private updateDateStats(node: RepositoryNode): void {
    const oldest = this.stats.oldestFiles;
    const newest = this.stats.newestFiles;

    // قدیمی‌ترین
    if (oldest.length < 5) {
      oldest.push(node);
      oldest.sort((a, b) => a.modifiedAt.getTime() - b.modifiedAt.getTime());
    } else if (node.modifiedAt < oldest[oldest.length - 1]?.modifiedAt) {
      oldest.pop();
      oldest.push(node);
      oldest.sort((a, b) => a.modifiedAt.getTime() - b.modifiedAt.getTime());
    }

    // جدیدترین
    if (newest.length < 5) {
      newest.push(node);
      newest.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());
    } else if (node.modifiedAt > newest[newest.length - 1]?.modifiedAt) {
      newest.pop();
      newest.push(node);
      newest.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());
    }
  }

  public getStats(): RepoStats {
    return this.stats;
  }

  public toJSON(): Record<string, unknown> {
    return {
      totalFiles: this.stats.totalFiles,
      totalDirectories: this.stats.totalDirectories,
      totalSize: this.stats.totalSize,
      totalLines: this.stats.totalLines,
      totalSizeFormatted: this.formatSize(this.stats.totalSize),
      languages: Array.from(this.stats.languages.entries()).map(
        ([name, data]) => ({
          name,
          fileCount: data.fileCount,
          lineCount: data.lineCount,
          totalSize: data.totalSize,
          totalSizeFormatted: this.formatSize(data.totalSize),
        }),
      ),
      extensions: Array.from(this.stats.extensionStats.entries()).map(
        ([ext, data]) => ({
          extension: ext,
          fileCount: data.fileCount,
          totalSize: data.totalSize,
          totalSizeFormatted: this.formatSize(data.totalSize),
        }),
      ),
      largestFiles: this.stats.largestFiles.map((f) => ({
        path: f.path,
        size: f.size,
        sizeFormatted: this.formatSize(f.size),
      })),
      oldestFiles: this.stats.oldestFiles.map((f) => ({
        path: f.path,
        modifiedAt: f.modifiedAt.toISOString(),
      })),
      newestFiles: this.stats.newestFiles.map((f) => ({
        path: f.path,
        modifiedAt: f.modifiedAt.toISOString(),
      })),
    };
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  }
}
