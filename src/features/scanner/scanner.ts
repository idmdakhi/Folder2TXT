import type { RepositoryNode } from '../../core/domain/index.js';
import type { ScanResult } from './scan-result.js';

export interface Scanner {
  scan(): AsyncIterable<RepositoryNode>;
  result(): ScanResult;
}
