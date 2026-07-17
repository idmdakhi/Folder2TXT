import { NodeFileSystem } from '../infrastructure/filesystem/index.js';
import { RepositoryScanner } from '../features/scanner/repository-scanner.js';
import {
  TextExporter,
  MarkdownExporter,
  type ExportContext,
  type Exporter,
} from '../features/exporter/index.js';
import { TextWriter } from '../features/writer/index.js';
import type { Repo2TxtConfig } from '../features/config/index.js';

export class Container {
  public readonly filesystem: NodeFileSystem;
  public readonly writer: TextWriter;

  constructor(private readonly config: Repo2TxtConfig) {
    this.filesystem = new NodeFileSystem();
    this.writer = new TextWriter({ encoding: config.encoding });
  }

  createScanner(): RepositoryScanner {
    return new RepositoryScanner(this.filesystem, {
      root: this.config.root,
      includeHidden: this.config.includeHidden,
      followSymlinks: this.config.followSymlinks,
      includePatterns: this.config.include,
      excludePatterns: this.config.exclude,
      gitignore: this.config.gitignore ?? true,
      detectBinary: this.config.detectBinary ?? true,
      enableStats: this.config.includeStatistics ?? true,
      concurrency: this.config.concurrency ?? 4,
      maxFileSize: this.config.maxFileSize,
    });
  }

  createExporter(context: Omit<ExportContext, 'filesystem'>): Exporter {
    const fullContext = { ...context, filesystem: this.filesystem };
    if (this.config.format === 'md') {
      return new MarkdownExporter(fullContext);
    }
    return new TextExporter(fullContext);
  }
}
