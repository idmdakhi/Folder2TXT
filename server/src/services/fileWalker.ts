import { readdir, stat } from "fs/promises";
import path from "path";

export interface WalkedFile {
  relPath: string;
  absPath: string;
  size: number;
}

/**
 * پیمایش بازگشتی یک دایرکتوری. پوشه‌های داخل ignoredDirNames
 * برای جلوگیری از پیمایش‌های سنگین (node_modules و ...) رد می‌شوند.
 */
export async function walkDirectory(
  rootDir: string,
  ignoredDirNames: string[]
): Promise<WalkedFile[]> {
  const results: WalkedFile[] = [];
  const ignoredSet = new Set(ignoredDirNames);

  async function walk(currentDir: string) {
    let entries;
    try {
      entries = await readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (ignoredSet.has(entry.name)) continue;
        await walk(path.join(currentDir, entry.name));
      } else if (entry.isFile()) {
        const absPath = path.join(currentDir, entry.name);
        try {
          const st = await stat(absPath);
          results.push({
            relPath: path.relative(rootDir, absPath).split(path.sep).join("/"),
            absPath,
            size: st.size,
          });
        } catch {
          // فایل شاید symlink شکسته باشد؛ رد می‌شود
        }
      }
    }
  }

  await walk(rootDir);
  return results;
}
