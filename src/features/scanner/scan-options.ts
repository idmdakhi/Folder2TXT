import type { Glob } from '../glob/index.js';
import type { IgnoreEngine } from '../ignore/index.js';

export interface ScanOptions {
  /** ریشه مخزن */
  root: string;

  /** شامل کردن فایل‌های مخفی */
  includeHidden?: boolean;

  /** دنبال کردن لینک‌های سمبلیک */
  followSymlinks?: boolean;

  /** سیگنال برای لغو عملیات */
  signal?: AbortSignal;

  /** الگوهای Include */
  includePatterns?: readonly string[];

  /** الگوهای Exclude */
  excludePatterns?: readonly string[];

  /** موتور تطابق گلوب */
  glob?: Glob;

  /** موتور نادیده‌گیری */
  ignoreEngine?: IgnoreEngine;

  // === فیلدهای جدید ===

  /** فعال‌سازی .gitignore (پیش‌فرض: true) */
  gitignore?: boolean;

  /** تشخیص فایل‌های باینری (پیش‌فرض: true) */
  detectBinary?: boolean;

  /** جمع‌آوری آمار (پیش‌فرض: true) */
  enableStats?: boolean;

  /** تعداد تردهای موازی برای خواندن فایل‌ها (پیش‌فرض: 1 = بدون موازی) */
  concurrency?: number;

  /** حداکثر حجم فایل برای خواندن (بایت) */
  maxFileSize?: number;

  /** حداکثر حجم فایل برای بررسی باینری (بایت) */
  maxBinaryCheckSize?: number;
}
