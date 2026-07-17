import type { Glob } from './glob.js';
import { normalizePath } from '../../shared/utils/index.js';

/**
 * پیاده‌سازی کامل تطابق گلوب با پشتیبانی از:
 * - * (هر کاراکتر به جز /)
 * - ** (هر کاراکتر از جمله /)
 * - ? (یک کاراکتر)
 * - الگوهای چندبخشی
 */
export class GlobMatcher implements Glob {
  matches(path: string, pattern: string): boolean {
    const normalizedPath = normalizePath(path);
    const normalizedPattern = normalizePath(pattern);
    const regex = this.patternToRegExp(normalizedPattern);
    return regex.test(normalizedPath);
  }

  matchesAny(path: string, patterns: readonly string[]): boolean {
    return patterns.some((p) => this.matches(path, p));
  }

  private patternToRegExp(pattern: string): RegExp {
    // کاراکترهای خاص رجکس را escape می‌کنیم به جز * و ?
    let escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    // جایگزینی ** با .* (هر چیزی)
    escaped = escaped.replace(/\*\*/g, '::DOUBLE_STAR::');
    // جایگزینی * با [^/]* (هر چیزی به جز اسلش)
    escaped = escaped.replace(/\*/g, '[^/]*');
    // بازگرداندن **
    escaped = escaped.replace(/::DOUBLE_STAR::/g, '.*');
    // جایگزینی ? با .
    escaped = escaped.replace(/\?/g, '.');
    // تطابق کامل از ابتدا تا انتها
    return new RegExp(`^${escaped}$`);
  }
}
