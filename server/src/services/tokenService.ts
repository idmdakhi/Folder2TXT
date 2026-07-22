/**
 * تخمین سریع تعداد توکن بدون وابستگی به مدل خاص.
 * قاعده تجربی: هر ~4 کاراکتر انگلیسی ~1 توکن. برای کد معمولا نزدیک است.
 * این تخمین برای هدف این ابزار (chunk کردن خروجی) کافی و سبک است.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  const normalized = text.trim();
  if (!normalized) return 0;
  return Math.ceil(normalized.length / 4);
}
