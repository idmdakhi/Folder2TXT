import type { RepositoryNode } from '../../core/domain/index.js';

/**
 * رویداد شروع اسکن
 */
export interface ScanStartedEvent {
  root: string;
  startedAt: Date;
}

/**
 * رویداد یافتن یک فایل
 */
export interface FileFoundEvent {
  node: RepositoryNode;
  index: number;
  total: number;
}

/**
 * رویداد یافتن یک پوشه
 */
export interface DirectoryFoundEvent {
  node: RepositoryNode;
  index: number;
  total: number;
}

/**
 * رویداد پایان اسکن
 */
export interface ScanFinishedEvent {
  finishedAt: Date;
  total: number;
  files: number;
  directories: number;
  bytes: number;
  durationMs: number;
}

/**
 * نوع‌های رویدادهای اسکن
 */
export type ScanEvent =
  | { type: 'started'; payload: ScanStartedEvent }
  | { type: 'fileFound'; payload: FileFoundEvent }
  | { type: 'directoryFound'; payload: DirectoryFoundEvent }
  | { type: 'finished'; payload: ScanFinishedEvent }
  | { type: 'error'; payload: { error: Error; path?: string } };
