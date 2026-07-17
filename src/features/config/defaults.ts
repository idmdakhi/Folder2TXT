import type { Repo2TxtConfig } from './config.js';
import {
  DEFAULT_ENCODING,
  DEFAULT_OUTPUT_FILENAME,
  DEFAULT_MAX_CONCURRENT_TASKS,
  DEFAULT_MAX_FILE_SIZE,
  DEFAULT_INCLUDE_PATTERNS,
  DEFAULT_IGNORE_PATTERNS,
} from '../../shared/constants.js';

export const DEFAULT_CONFIG: Readonly<Repo2TxtConfig> = Object.freeze({
  root: process.cwd(),
  output: DEFAULT_OUTPUT_FILENAME,
  format: 'txt',
  encoding: DEFAULT_ENCODING,
  include: [...DEFAULT_INCLUDE_PATTERNS],
  exclude: [...DEFAULT_IGNORE_PATTERNS],
  maxFileSize: DEFAULT_MAX_FILE_SIZE,
  includeHidden: false,
  followSymlinks: false,
  detectBinary: true,
  renderTree: true,
  includeStatistics: true,
  removeComments: false,
  removeBlankLines: false,
  trimTrailingWhitespace: false,
  collapseBlankLines: false,
  preserveFileOrder: false,
  concurrency: DEFAULT_MAX_CONCURRENT_TASKS,
  failFast: true,
  bom: false,

  // ===== فیلدهای جدید نسخه 2.0 =====
  outputFormat: 'txt',
  watchMode: false,
  enableStats: true,
  enableMinify: false,
  gitignore: true,
});
