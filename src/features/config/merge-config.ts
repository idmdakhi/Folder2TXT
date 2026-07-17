import type { Repo2TxtConfig } from './config.js';
import { DEFAULT_CONFIG } from './defaults.js';

export function mergeConfig(
  partial: Partial<Repo2TxtConfig> = {},
): Repo2TxtConfig {
  return {
    ...DEFAULT_CONFIG,
    ...partial,
    // فیلدهای آرایه‌ای را با هم ترکیب می‌کنیم (اگر partial مقدار داشته باشد)
    include: partial.include ?? DEFAULT_CONFIG.include,
    exclude: partial.exclude ?? DEFAULT_CONFIG.exclude,
    // فیلدهای جدید هم به‌صورت خودکار با spread ترکیب می‌شوند
  };
}
