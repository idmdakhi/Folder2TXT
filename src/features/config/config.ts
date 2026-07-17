export type OutputFormat = 'txt' | 'md';

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
}
