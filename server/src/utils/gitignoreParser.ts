import { readFile } from "fs/promises";
import path from "path";
import ignorePkg from "ignore";
import type { Ignore } from "ignore";

const ignore = ignorePkg as unknown as (options?: unknown) => Ignore;

/**
 * تمام فایل‌های .gitignore موجود در درخت پروژه را پیدا کرده
 * و یک شیء ignore واحد (نسبت به ریشه repo) برمی‌گرداند.
 */
export async function buildGitignore(rootDir: string, allFilePaths: string[]): Promise<Ignore> {
  const ig = ignore();

  const gitignoreFiles = allFilePaths.filter((p) => path.basename(p) === ".gitignore");

  for (const relPath of gitignoreFiles) {
    const absPath = path.join(rootDir, relPath);
    try {
      const content = await readFile(absPath, "utf-8");
      const dir = path.dirname(relPath);
      const lines = content
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("#"));

      for (const line of lines) {
        // اگر gitignore در ساب‌فولدر باشد، الگو را نسبت به ریشه بازنویسی می‌کنیم
        if (dir === ".") {
          ig.add(line);
        } else {
          const negate = line.startsWith("!");
          const pattern = negate ? line.slice(1) : line;
          const prefixed = path.posix.join(dir, pattern);
          ig.add(negate ? `!${prefixed}` : prefixed);
        }
      }
    } catch {
      // نادیده گرفتن خطای خواندن فایل
    }
  }

  // .gitignore خود پروژه هم به صورت پیش‌فرض حذف شود
  ig.add(".git");

  return ig;
}
