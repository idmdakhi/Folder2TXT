import path from "path";
import { minimatch } from "minimatch";
import { Ignore } from "ignore";
import { FileEntry, Repo2TextConfig } from "../types.js";
import { WalkedFile } from "./fileWalker.js";
import { hasKnownBinaryExtension, isLikelyBinary } from "../utils/binaryCheck.js";

export async function classifyFiles(
  files: WalkedFile[],
  config: Repo2TextConfig,
  gitignore: Ignore | null
): Promise<FileEntry[]> {
  const result: FileEntry[] = [];

  for (const f of files) {
    const ext = path.extname(f.relPath).toLowerCase();
    let included = true;
    let skipReason: string | undefined;

    if (config.respectGitignore && gitignore?.ignores(f.relPath)) {
      included = false;
      skipReason = "gitignore";
    }

    if (included && config.includePatterns.length > 0) {
      const matches = config.includePatterns.some((p) => minimatch(f.relPath, p, { dot: true }));
      if (!matches) {
        included = false;
        skipReason = "include-pattern-mismatch";
      }
    }

    if (included && config.excludePatterns.length > 0) {
      const matches = config.excludePatterns.some((p) => minimatch(f.relPath, p, { dot: true }));
      if (matches) {
        included = false;
        skipReason = "exclude-pattern";
      }
    }

    if (included && config.includeExtensions.length > 0 && !config.includeExtensions.includes(ext)) {
      included = false;
      skipReason = "extension-not-included";
    }

    if (included && config.excludeExtensions.includes(ext)) {
      included = false;
      skipReason = "extension-excluded";
    }

    if (included && f.size > config.maxFileSizeKB * 1024) {
      included = false;
      skipReason = "file-too-large";
    }

    let isBinary = false;
    if (included) {
      isBinary = hasKnownBinaryExtension(ext) || (await isLikelyBinary(f.absPath));
      if (isBinary && config.excludeBinary) {
        included = false;
        skipReason = "binary";
      }
    }

    result.push({
      path: f.relPath,
      absPath: f.absPath,
      size: f.size,
      extension: ext,
      isBinary,
      included,
      skipReason,
    });
  }

  return result;
}
