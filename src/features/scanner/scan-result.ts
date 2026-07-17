export interface ScanResult {
  total: number;
  files: number;
  directories: number;
  bytes: number;
  startedAt: Date;
  finishedAt: Date;
}
