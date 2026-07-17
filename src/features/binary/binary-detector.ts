import { readFile } from 'node:fs/promises';
import { stat } from 'node:fs/promises';

export interface BinaryDetectionOptions {
  sampleSize?: number;
  maxTextRatio?: number;
}

const DEFAULT_OPTIONS: Required<BinaryDetectionOptions> = {
  sampleSize: 8192, // 8KB برای نمونه
  maxTextRatio: 0.95, // 95% کاراکترهای قابل چاپ = متن
};

/**
 * تشخیص باینری بودن فایل با بررسی محتوا
 */
export async function isBinaryFile(
  path: string,
  options: BinaryDetectionOptions = {},
): Promise<boolean> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // بررسی حجم فایل
  const fileStat = await stat(path);
  if (fileStat.size === 0) {
    return false;
  }

  // خواندن نمونه
  const sampleSize = Math.min(opts.sampleSize, fileStat.size);
  const buffer = await readFile(path, {
    encoding: undefined,
    flag: 'r',
    ...(sampleSize > 0 && { start: 0, end: sampleSize }),
  } as any);

  return isBinaryBuffer(buffer, opts.maxTextRatio);
}

/**
 * تشخیص باینری بودن بافر
 */
export function isBinaryBuffer(buffer: Buffer, maxTextRatio = 0.95): boolean {
  let textCount = 0;
  let totalCount = 0;

  for (const byte of buffer) {
    totalCount++;
    // کاراکترهای قابل چاپ: 32-126 + newline + tab + carriage return
    if (
      (byte >= 32 && byte <= 126) ||
      byte === 10 ||
      byte === 13 ||
      byte === 9
    ) {
      textCount++;
    }
  }

  // اگر تعداد کاراکترهای غیرقابل چاپ بیشتر از حد مجاز باشد
  const textRatio = textCount / totalCount;
  return textRatio < maxTextRatio;
}

/**
 * بررسی پسوند باینری
 */
export function isBinaryExtension(extension: string): boolean {
  const binaryExtensions = new Set([
    'png',
    'jpg',
    'jpeg',
    'gif',
    'bmp',
    'ico',
    'svg',
    'pdf',
    'zip',
    'gz',
    'tar',
    '7z',
    'rar',
    'exe',
    'dll',
    'so',
    'dylib',
    'mp3',
    'mp4',
    'avi',
    'mov',
    'wmv',
    'class',
    'jar',
    'war',
    'ttf',
    'woff',
    'woff2',
    'eot',
    'otf',
    'psd',
    'ai',
    'eps',
    'db',
    'sqlite',
  ]);
  return binaryExtensions.has(extension.toLowerCase());
}
