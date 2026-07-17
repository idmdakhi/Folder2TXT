export type OutputFormat = 'txt' | 'md' | 'json';

export interface Repo2TxtConfig {
  root: string;
  output: string;
  format: OutputFormat;
  encoding: BufferEncoding;
  include: readonly string[];
  exclude: readonly string[];
  maxFileSize: number;
  includeHidden: boolean;
  followSymlinks: boolean;
  detectBinary: boolean;
  renderTree: boolean;
  includeStatistics: boolean;
  removeComments: boolean;
  removeBlankLines: boolean;
  trimTrailingWhitespace: boolean;
  collapseBlankLines: boolean;
  preserveFileOrder: boolean;
  concurrency: number;
  failFast: boolean;
  bom: boolean;

  // ===== فیلدهای جدید نسخه 2.0 =====
  /** فرمت خروجی (txt, md, json) */
  outputFormat: OutputFormat;

  /** حالت واتچ (نظارت بر تغییرات) */
  watchMode: boolean;

  /** جمع‌آوری آمار پیشرفته */
  enableStats: boolean;

  /** فشرده‌سازی خروجی */
  enableMinify: boolean;

  /** استفاده از قواعد .gitignore */
  gitignore: boolean;
}
