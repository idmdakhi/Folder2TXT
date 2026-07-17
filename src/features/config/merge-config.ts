import type { Repo2TxtConfig } from './config.js';
import { DEFAULT_CONFIG } from './defaults.js';

export function mergeConfig(
  partial: Partial<Repo2TxtConfig> = {},
): Repo2TxtConfig {
  return {
    ...DEFAULT_CONFIG,
    ...partial,
    include: partial.include ?? DEFAULT_CONFIG.include,
    exclude: partial.exclude ?? DEFAULT_CONFIG.exclude,
  };
}
