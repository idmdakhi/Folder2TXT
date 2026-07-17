import type { Repo2TxtConfig } from './config.js';
import { Repo2TxtError } from '../../shared/errors/index.js';

export function validateConfig(config: Repo2TxtConfig): void {
  if (!config.root.trim()) {
    throw new Repo2TxtError('Configuration "root" must not be empty.', {
      code: 'CONFIG_ROOT_EMPTY',
    });
  }
  if (!config.output.trim()) {
    throw new Repo2TxtError('Configuration "output" must not be empty.', {
      code: 'CONFIG_OUTPUT_EMPTY',
    });
  }
  if (config.include.length === 0) {
    throw new Repo2TxtError('At least one include pattern is required.', {
      code: 'CONFIG_INCLUDE_EMPTY',
    });
  }
  if (config.maxFileSize <= 0 || !Number.isFinite(config.maxFileSize)) {
    throw new Repo2TxtError('maxFileSize must be a positive finite number.', {
      code: 'CONFIG_INVALID_MAX_FILE_SIZE',
    });
  }
  if (config.concurrency < 1 || !Number.isInteger(config.concurrency)) {
    throw new Repo2TxtError('concurrency must be a positive integer.', {
      code: 'CONFIG_INVALID_CONCURRENCY',
    });
  }
  // بررسی تکراری‌ها
  const includes = new Set(config.include);
  if (includes.size !== config.include.length) {
    throw new Repo2TxtError('Duplicate include patterns detected.', {
      code: 'CONFIG_DUPLICATE_INCLUDE',
    });
  }
  const excludes = new Set(config.exclude);
  if (excludes.size !== config.exclude.length) {
    throw new Repo2TxtError('Duplicate exclude patterns detected.', {
      code: 'CONFIG_DUPLICATE_EXCLUDE',
    });
  }
}
