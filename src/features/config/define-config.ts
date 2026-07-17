import type { Repo2TxtConfig } from './config.js';

/**
 * تابع کمکی برای تعریف پیکربندی با نوع‌دهی کامل
 *
 * مثال:
 * export default defineConfig({
 *   output: 'repository.md',
 *   format: 'md',
 *   renderTree: true,
 * });
 */
export function defineConfig(
  config: Partial<Repo2TxtConfig>,
): Partial<Repo2TxtConfig> {
  return config;
}
