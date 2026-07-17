import type { RepositoryNode } from '../../core/domain/index.js';
import type { FileSystem } from '../filesystem/index.js';

export interface ExportContext {
  nodes: readonly RepositoryNode[];
  root: string;
  includeTree: boolean;
  includeContent: boolean;
  filesystem?: FileSystem; // برای خواندن محتوای فایل‌ها
}
