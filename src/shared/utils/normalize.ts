export function normalizeText(input: string, options: any = {}): string {
  let text = input;
  if (options.normalizeLineEndings !== false) {
    text = text.replace(/\r\n?/g, '\n');
  }
  if (options.trimTrailingWhitespace) {
    text = text.replace(/[ \t]+$/gm, '');
  }
  if (options.collapseBlankLines) {
    text = text.replace(/\n{3,}/g, '\n\n');
  }
  if (options.ensureFinalNewline !== false) {
    text = text.replace(/\n*$/, '\n');
  }
  return text;
}
