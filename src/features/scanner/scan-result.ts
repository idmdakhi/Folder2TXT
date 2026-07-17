export interface ScanResult {
  /** تعداد کل گره‌ها */
  total: number;

  /** تعداد فایل‌ها */
  files: number;

  /** تعداد پوشه‌ها */
  directories: number;

  /** حجم کل (بایت) */
  bytes: number;

  /** زمان شروع */
  startedAt: Date;

  /** زمان پایان */
  finishedAt: Date;

  /** مدت زمان (میلی‌ثانیه) */
  durationMs: number;

  /** آمار پیشرفته (اختیاری) */
  stats?: Record<string, unknown>;
}
