import { Repo2TxtError } from '../../shared/errors/index.js';

export class ScannerError extends Repo2TxtError {
  constructor(message: string, options?: any) {
    super(message, { code: 'SCANNER_ERROR', ...options });
    this.name = 'ScannerError';
  }
}

export class ScanAbortedError extends ScannerError {
  constructor() {
    super('Scan aborted by user signal');
    this.name = 'ScanAbortedError';
  }
}

export class ScanPermissionError extends ScannerError {
  constructor(path: string, cause?: unknown) {
    super(`Permission denied: ${path}`, {
      code: 'SCAN_PERMISSION_DENIED',
      cause,
      details: { path },
    });
    this.name = 'ScanPermissionError';
  }
}

export class ScanReadError extends ScannerError {
  constructor(path: string, cause?: unknown) {
    super(`Failed to read: ${path}`, {
      code: 'SCAN_READ_ERROR',
      cause,
      details: { path },
    });
    this.name = 'ScanReadError';
  }
}
