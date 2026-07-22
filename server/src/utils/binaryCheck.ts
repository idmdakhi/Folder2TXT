import { readFile } from "fs/promises";

const KNOWN_BINARY_EXT = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".webp", ".avif",
  ".pdf", ".zip", ".tar", ".gz", ".7z", ".rar",
  ".exe", ".dll", ".so", ".dylib", ".bin",
  ".mp3", ".mp4", ".mov", ".avi", ".wav", ".flac", ".ogg",
  ".ttf", ".otf", ".woff", ".woff2", ".eot",
  ".class", ".jar", ".pyc", ".wasm",
  ".sqlite", ".db",
]);

export function hasKnownBinaryExtension(ext: string): boolean {
  return KNOWN_BINARY_EXT.has(ext.toLowerCase());
}

/**
 * بررسی محتوایی: چند کیلوبایت اول فایل را می‌خواند و اگر بایت null
 * یا نسبت بالایی از کاراکترهای غیرقابل‌چاپ داشت، باینری تشخیص می‌دهد.
 */
export async function isLikelyBinary(absPath: string): Promise<boolean> {
  try {
    const fh = await readFile(absPath);
    const sample = fh.subarray(0, Math.min(fh.length, 8000));
    if (sample.length === 0) return false;

    let suspicious = 0;
    for (let i = 0; i < sample.length; i++) {
      const byte = sample[i];
      if (byte === 0) return true; // null byte = تقریبا قطعا باینری
      if (byte < 7 || (byte > 14 && byte < 32 && byte !== 27)) {
        suspicious++;
      }
    }
    return suspicious / sample.length > 0.3;
  } catch {
    return false;
  }
}
