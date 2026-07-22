export type OutputFormat = "plain" | "markdown" | "xml";
export type SortBy = "path" | "size" | "extension" | "tokens";

export interface Repo2TextConfig {
  /** الگوهای include به سبک glob (مثلا src/**\/*.ts) */
  includePatterns: string[];
  /** الگوهای exclude به سبک glob */
  excludePatterns: string[];
  /** فایل‌های .gitignore پروژه رعایت شوند */
  respectGitignore: boolean;
  /** حداکثر حجم هر فایل به کیلوبایت - بزرگتر از این رد می‌شود */
  maxFileSizeKB: number;
  /** حداکثر حجم کل خروجی به مگابایت */
  maxTotalSizeMB: number;
  /** فایل‌های باینری کاملا حذف شوند */
  excludeBinary: boolean;
  /** درخت فایل‌ها در ابتدای خروجی درج شود */
  includeFileTree: boolean;
  /** شماره خط قبل از هر خط کد */
  includeLineNumbers: boolean;
  /** حذف کامنت‌های تک‌خطی و چندخطی رایج (best effort) */
  stripComments: boolean;
  /** فرمت خروجی نهایی */
  outputFormat: OutputFormat;
  /** اگر عدد بدهید، خروجی بر اساس تعداد توکن تقریبی chunk می‌شود (0 یا null = بدون chunk) */
  chunkByTokens: number | null;
  /** متن دلخواه ابتدای فایل خروجی */
  customHeader: string;
  /** متن دلخواه انتهای فایل خروجی */
  customFooter: string;
  /** ترتیب نمایش فایل‌ها */
  sortBy: SortBy;
  /** پسوندهایی که صراحتا باید لحاظ شوند (خالی = همه) */
  includeExtensions: string[];
  /** پسوندهایی که صراحتا باید حذف شوند */
  excludeExtensions: string[];
  /** نام پوشه‌هایی که همیشه نادیده گرفته می‌شوند */
  ignoredDirNames: string[];
}

export interface FileEntry {
  path: string; // relative path
  absPath: string;
  size: number; // bytes
  extension: string;
  isBinary: boolean;
  tokens?: number;
  included: boolean;
  skipReason?: string;
}

export interface AnalyzeResult {
  sessionId: string;
  files: FileEntry[];
  totalFiles: number;
  totalIncluded: number;
  totalSizeBytes: number;
  totalTokensEstimate: number;
}

export interface GenerateRequestBody {
  sessionId: string;
  config: Repo2TextConfig;
  selectedPaths: string[]; // subset of files user wants in the final output
}

export interface GenerateResult {
  chunks: string[]; // one or more text chunks
  totalTokensEstimate: number;
  totalChars: number;
}
