import { afterEach, beforeEach } from 'vitest';

/**
 * راه‌اندازی جهانی تست‌ها
 */
beforeEach(() => {
  // پاکسازی متغیرهای محیطی قبل از هر تست
  delete process.env.LOG_LEVEL;
  delete process.env.REPO_ROOT;
  delete process.env.OUTPUT_FILE;
});

afterEach(() => {
  // پاکسازی بعد از هر تست
});
