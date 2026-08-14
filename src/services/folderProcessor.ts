import path from "path";
import { walkDir } from "./folderWalker";
import {
  ProcessOptions,
  ProcessResult,
  cleanContent,
  formatOutput,
} from "../shared/core";

export async function processFolder(
  folderPath: string,
  options: ProcessOptions = {},
): Promise<ProcessResult> {
  const files = await walkDir(
    folderPath,
    folderPath,
    options.ignorePatterns,
    0,
    options.maxDepth,
  );

  // اعمال فیلترهای انتخابی
  let filteredFiles = files;
  if (options.selectedTypes && options.selectedTypes.length > 0) {
    const typesSet = new Set(options.selectedTypes);
    filteredFiles = files.filter((f) => {
      const ext = path.extname(f.path).slice(1).toLowerCase();
      return typesSet.has(ext);
    });
  }

  if (options.commonOnly) {
    const commonTypes = new Set([
      "txt",
      "js",
      "py",
      "json",
      "md",
      "html",
      "css",
      "yml",
      "yaml",
      "xml",
      "sql",
      "gradle",
      "kt",
    ]);
    filteredFiles = filteredFiles.filter((f) => {
      const ext = path.extname(f.path).slice(1).toLowerCase();
      return commonTypes.has(ext);
    });
  }

  if (options.cleanMode) {
    for (const f of filteredFiles) {
      if (f.content) {
        const ext = path.extname(f.path).slice(1).toLowerCase();
        f.content = cleanContent(f.content, ext);
      }
    }
  }

  const output = formatOutput(filteredFiles, folderPath, options.separator);

  const totalSize = filteredFiles.reduce((sum, f) => sum + (f.size || 0), 0);
  return {
    content: output,
    fileCount: filteredFiles.length,
    totalSize,
    files: filteredFiles,
  };
}
