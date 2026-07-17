export interface MinifierOptions {
  removeComments?: boolean;
  removeWhitespace?: boolean;
  collapseLines?: boolean;
}

/**
 * فشرده‌سازی محتوای فایل
 */
export class Minifier {
  constructor(private options: MinifierOptions = {}) {}

  public minify(content: string, extension: string): string {
    let result = content;

    // حذف کامنت‌ها برای انواع خاص
    if (this.options.removeComments) {
      result = this.removeComments(result, extension);
    }

    // حذف فاصله‌های اضافی
    if (this.options.removeWhitespace) {
      result = this.removeWhitespace(result, extension);
    }

    // فشرده‌سازی خطوط خالی
    if (this.options.collapseLines) {
      result = this.collapseLines(result);
    }

    return result;
  }

  private removeComments(content: string, extension: string): string {
    // حذف کامنت‌های بلوکی (/* */)
    let result = content.replace(/\/\*[\s\S]*?\*\//g, '');

    // حذف کامنت‌های خطی برای زبان‌های خاص
    const commentExtensions = [
      'js',
      'ts',
      'jsx',
      'tsx',
      'c',
      'cpp',
      'java',
      'go',
      'rs',
    ];
    if (commentExtensions.includes(extension.toLowerCase())) {
      result = result.replace(/\/\/.*$/gm, '');
    }

    // حذف کامنت‌های هش (#) برای Python, Shell
    const hashExtensions = ['py', 'sh', 'bash', 'zsh', 'fish', 'rb'];
    if (hashExtensions.includes(extension.toLowerCase())) {
      result = result.replace(/^\s*#.*$/gm, '');
    }

    return result;
  }

  private removeWhitespace(content: string, extension: string): string {
    let result = content;

    // حذف فاصله‌های انتهای خط
    result = result.replace(/[ \t]+$/gm, '');

    // حذف فاصله‌های اضافی بین کلمات (برای کدها)
    // این کار را فقط برای فایل‌های کد انجام می‌دهیم
    const codeExtensions = [
      'js',
      'ts',
      'jsx',
      'tsx',
      'c',
      'cpp',
      'java',
      'go',
      'rs',
      'py',
    ];
    if (codeExtensions.includes(extension.toLowerCase())) {
      // حذف فاصله‌های اضافی بین عبارات
      result = result.replace(/\s{2,}/g, ' ');
    }

    return result;
  }

  private collapseLines(content: string): string {
    // تبدیل خطوط خالی متوالی به یک خط خالی
    return content.replace(/\n{3,}/g, '\n\n');
  }
}
