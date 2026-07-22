import { readFile } from "fs/promises";
import { FileEntry, GenerateResult, Repo2TextConfig } from "../types.js";
import { estimateTokens } from "./tokenService.js";

function buildFileTree(paths: string[]): string {
  interface Node {
    [key: string]: Node;
  }
  const root: Node = {};

  for (const p of paths) {
    const parts = p.split("/");
    let node = root;
    for (const part of parts) {
      node[part] = node[part] || {};
      node = node[part];
    }
  }

  const lines: string[] = [];
  function render(node: Node, prefix: string) {
    const keys = Object.keys(node).sort();
    keys.forEach((key, idx) => {
      const isLast = idx === keys.length - 1;
      lines.push(`${prefix}${isLast ? "└── " : "├── "}${key}`);
      const childPrefix = prefix + (isLast ? "    " : "│   ");
      render(node[key], childPrefix);
    });
  }
  render(root, "");
  return lines.join("\n");
}

function stripCommentsBestEffort(content: string, ext: string): string {
  const cLike = [".ts", ".tsx", ".js", ".jsx", ".java", ".c", ".cpp", ".cs", ".go", ".rs", ".swift", ".kt"];
  const hashLike = [".py", ".rb", ".sh", ".yaml", ".yml"];

  if (cLike.includes(ext)) {
    return content
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/.*$/gm, "$1")
      .replace(/\n{3,}/g, "\n\n");
  }
  if (hashLike.includes(ext)) {
    return content
      .replace(/(^|[^"'])#.*$/gm, "$1")
      .replace(/\n{3,}/g, "\n\n");
  }
  return content;
}

function addLineNumbers(content: string): string {
  return content
    .split("\n")
    .map((line, i) => `${String(i + 1).padStart(5, " ")}| ${line}`)
    .join("\n");
}

function wrapFile(relPath: string, content: string, format: Repo2TextConfig["outputFormat"]): string {
  switch (format) {
    case "markdown": {
      const lang = relPath.split(".").pop() || "";
      return `## \`${relPath}\`\n\n\`\`\`${lang}\n${content}\n\`\`\`\n`;
    }
    case "xml":
      return `<file path="${relPath}">\n${content}\n</file>\n`;
    case "plain":
    default:
      return `----- FILE: ${relPath} -----\n${content}\n`;
  }
}

export async function generateOutput(
  files: FileEntry[],
  selectedPaths: string[],
  config: Repo2TextConfig
): Promise<GenerateResult> {
  const selectedSet = new Set(selectedPaths);
  let selected = files.filter((f) => f.included && selectedSet.has(f.path));

  switch (config.sortBy) {
    case "size":
      selected = selected.sort((a, b) => a.size - b.size);
      break;
    case "extension":
      selected = selected.sort((a, b) => a.extension.localeCompare(b.extension));
      break;
    case "path":
    default:
      selected = selected.sort((a, b) => a.path.localeCompare(b.path));
  }

  const sections: string[] = [];

  if (config.customHeader.trim()) {
    sections.push(config.customHeader.trim() + "\n");
  }

  if (config.includeFileTree) {
    const treeText = buildFileTree(selected.map((f) => f.path));
    sections.push(
      config.outputFormat === "markdown"
        ? `## ساختار فایل‌ها\n\n\`\`\`\n${treeText}\n\`\`\`\n`
        : `FILE TREE:\n${treeText}\n`
    );
  }

  let totalSizeBytes = 0;
  for (const file of selected) {
    let content: string;
    try {
      content = await readFile(file.absPath, "utf-8");
    } catch {
      content = "[⚠️ خطا در خواندن فایل]";
    }

    if (config.stripComments) {
      content = stripCommentsBestEffort(content, file.extension);
    }
    if (config.includeLineNumbers) {
      content = addLineNumbers(content);
    }

    totalSizeBytes += Buffer.byteLength(content, "utf-8");
    sections.push(wrapFile(file.path, content, config.outputFormat));

    if (config.maxTotalSizeMB > 0 && totalSizeBytes > config.maxTotalSizeMB * 1024 * 1024) {
      sections.push("\n[⚠️ محدودیت حجم کل خروجی رعایت شد؛ باقی فایل‌ها درج نشدند]\n");
      break;
    }
  }

  if (config.customFooter.trim()) {
    sections.push("\n" + config.customFooter.trim());
  }

  const fullText = sections.join("\n");
  const totalTokensEstimate = estimateTokens(fullText);

  let chunks: string[];
  if (config.chunkByTokens && config.chunkByTokens > 0) {
    chunks = chunkText(sections, config.chunkByTokens);
  } else {
    chunks = [fullText];
  }

  return {
    chunks,
    totalTokensEstimate,
    totalChars: fullText.length,
  };
}

/** بخش‌بندی خروجی به تکه‌هایی که هرکدام تقریبا زیر سقف توکن مشخص‌شده باشند */
function chunkText(sections: string[], maxTokensPerChunk: number): string[] {
  const chunks: string[] = [];
  let current: string[] = [];
  let currentTokens = 0;

  for (const section of sections) {
    const sectionTokens = estimateTokens(section);
    if (currentTokens + sectionTokens > maxTokensPerChunk && current.length > 0) {
      chunks.push(current.join("\n"));
      current = [];
      currentTokens = 0;
    }
    current.push(section);
    currentTokens += sectionTokens;
  }
  if (current.length > 0) chunks.push(current.join("\n"));

  return chunks.length > 0 ? chunks : [""];
}
