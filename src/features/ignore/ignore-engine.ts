import type { IgnoreRule } from './ignore-rule.js';
import { normalizePath } from '../../shared/utils/index.js';

export class IgnoreEngine {
  private readonly rules: readonly IgnoreRule[];

  constructor(rules: readonly IgnoreRule[] = []) {
    this.rules = rules;
  }

  /**
   * تعیین می‌کند که آیا مسیر باید نادیده گرفته شود یا خیر.
   * قواعد به ترتیب اعمال می‌شوند و آخرین قاعده‌ای که تطابق دارد، تعیین‌کننده است.
   */
  ignores(path: string, isDirectory = false): boolean {
    const normalized = normalizePath(path);
    let ignored = false; // پیش‌فرض: شامل شود

    for (const rule of this.rules) {
      if (!this.matchesRule(normalized, rule, isDirectory)) continue;
      ignored = rule.type === 'exclude';
    }

    return ignored;
  }

  /**
   * افزودن قاعده به‌صورت immutable.
   */
  withRule(rule: IgnoreRule): IgnoreEngine {
    return new IgnoreEngine([...this.rules, rule]);
  }

  getRules(): readonly IgnoreRule[] {
    return this.rules;
  }

  private matchesRule(
    path: string,
    rule: IgnoreRule,
    isDirectory: boolean,
  ): boolean {
    if (rule.directoryOnly && !isDirectory) return false;
    const target = rule.caseSensitive ? path : path.toLowerCase();
    const pattern = rule.caseSensitive
      ? rule.pattern
      : rule.pattern.toLowerCase();
    return this.matchPattern(target, pattern, rule.anchored);
  }

  private matchPattern(
    path: string,
    pattern: string,
    anchored: boolean,
  ): boolean {
    // تبدیل الگوی ساده به رجکس با پشتیبانی از * و **
    let escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    escaped = escaped.replace(/\*\*/g, '.*');
    escaped = escaped.replace(/\*/g, '[^/]*');
    escaped = escaped.replace(/\?/g, '.');
    const regex = anchored
      ? new RegExp(`^${escaped}$`)
      : new RegExp(`(^|/)${escaped}($|/)`);
    return regex.test(path);
  }
}
