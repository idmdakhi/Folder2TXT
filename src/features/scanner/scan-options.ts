import type { Glob } from '../glob/index.js';
import type { IgnoreEngine } from '../ignore/index.js';

export interface ScanOptions {
  root: string;
  includeHidden?: boolean;
  followSymlinks?: boolean;
  signal?: AbortSignal;
  includePatterns?: readonly string[];
  excludePatterns?: readonly string[];
  glob?: Glob;
  ignoreEngine?: IgnoreEngine;
}
