import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { IgnoreRule } from './ignore-rule.js';

/**
 * پارس کردن فایل .gitignore و تبدیل به آرایه‌ای از IgnoreRule
 */
export async function parseGitIgnore(root: string): Promise<IgnoreRule[]> {
  const gitignorePath = join(root, '.gitignore');
  if (!existsSync(gitignorePath)) {
    return [];
  }

  const content = await readFile(gitignorePath, 'utf-8');
  return parseGitIgnoreContent(content);
}

/**
 * پارس محتوای .gitignore
 */
export function parseGitIgnoreContent(content: string): IgnoreRule[] {
  const rules: IgnoreRule[] = [];
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    // نادیده‌گیری خطوط خالی و کامنت‌ها
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    let pattern = trimmed;
    let type: 'include' | 'exclude' = 'exclude';
    let directoryOnly = false;

    // بررسی ! برای include (نادیده‌نگیری)
    if (pattern.startsWith('!')) {
      type = 'include';
      pattern = pattern.slice(1);
    }

    // بررسی / در انتها برای directory-only
    if (pattern.endsWith('/')) {
      directoryOnly = true;
      pattern = pattern.slice(0, -1);
    }

    // نرمال‌سازی الگو برای موتور ما
    pattern = normalizeGitIgnorePattern(pattern);

    rules.push({
      pattern,
      type,
      caseSensitive: false, // در ویندوز case-insensitive است
      directoryOnly,
      anchored: true, // الگوهای .gitignore معمولاً از ریشه نسبی هستند
    });
  }

  return rules;
}

/**
 * نرمال‌سازی الگوی .gitignore برای تطابق با موتور
 */
function normalizeGitIgnorePattern(pattern: string): string {
  // حذف اسلش اضافی در ابتدا (نسبی به ریشه)
  if (pattern.startsWith('/')) {
    pattern = pattern.slice(1);
  }

  // تبدیل ** به * (در موتور ما * قبلاً معادل ** است)
  // اما برای تطابق دقیق‌تر، آن را به .* تبدیل می‌کنیم
  pattern = pattern.replace(/\*\*/g, '*');

  return pattern;
}
