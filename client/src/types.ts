export type OutputFormat = "plain" | "markdown" | "xml";
export type SortBy = "path" | "size" | "extension" | "tokens";

export interface Repo2TextConfig {
  includePatterns: string[];
  excludePatterns: string[];
  respectGitignore: boolean;
  maxFileSizeKB: number;
  maxTotalSizeMB: number;
  excludeBinary: boolean;
  includeFileTree: boolean;
  includeLineNumbers: boolean;
  stripComments: boolean;
  outputFormat: OutputFormat;
  chunkByTokens: number | null;
  customHeader: string;
  customFooter: string;
  sortBy: SortBy;
  includeExtensions: string[];
  excludeExtensions: string[];
  ignoredDirNames: string[];
}

export interface FileEntry {
  path: string;
  absPath: string;
  size: number;
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

export interface GenerateResult {
  chunks: string[];
  totalTokensEstimate: number;
  totalChars: number;
}

export const defaultConfig: Repo2TextConfig = {
  includePatterns: [],
  excludePatterns: [],
  respectGitignore: true,
  maxFileSizeKB: 512,
  maxTotalSizeMB: 20,
  excludeBinary: true,
  includeFileTree: true,
  includeLineNumbers: false,
  stripComments: false,
  outputFormat: "markdown",
  chunkByTokens: null,
  customHeader: "",
  customFooter: "",
  sortBy: "path",
  includeExtensions: [],
  excludeExtensions: [],
  ignoredDirNames: [
    "node_modules",
    ".git",
    "dist",
    "build",
    ".next",
    ".turbo",
    "coverage",
    ".venv",
    "__pycache__",
    ".cache",
  ],
};
