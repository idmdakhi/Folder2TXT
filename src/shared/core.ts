// src/shared/core.ts

export interface FileEntry {
  path: string; // مسیر نسبی با جداکننده '/' (نرمال‌شده)
  content?: string;
  isBinary?: boolean;
  size?: number;
  error?: string;
}

export interface ProcessOptions {
  selectedTypes?: string[];
  cleanMode?: boolean;
  separator?: string;
  commonOnly?: boolean;
  maxDepth?: number;
  ignorePatterns?: string[];
}

export interface ProcessResult {
  content: string;
  fileCount: number;
  totalSize: number;
  files: FileEntry[]; // اضافه‌شده برای پشتیبانی از قالب‌ها
}

// ==================== سیستم Ignore حرفه‌ای ====================

/**
 * فایل‌هایی که محتوای آنها نباید در خروجی نمایش داده شود
 * (این فایل‌ها فقط در ساختار درختی ظاهر می‌شوند)
 */
export const DEFAULT_SKIP_FILES: string[] = [
  // فایل‌های قفل و پیکربندی
  "package-lock.json",
  "LICENSE",
  "yarn.lock",
  ".prettierrc",
  ".eslintrc",
  ".eslintrc.js",
  ".eslintrc.json",
  ".babelrc",
  ".babelrc.js",
  ".babelrc.json",
  "tsconfig.json",
  "webpack.config.js",
  "jest.config.js",
  ".env",
  ".env.local",
  ".env.development",
  ".env.production",
  ".env.test",
  "composer.lock",
  // لاگ‌ها
  "npm-debug.log",
  "yarn-error.log",
  // فایل‌های باینری کوچک (می‌توانند در لیست باشند)
  "*.log",
  "*.pid",
  "*.seed",
  "*.pid.lock",
];

/**
 * پوشه‌هایی که به طور کامل از پیمایش حذف می‌شوند
 * (می‌توانند نام دقیق یا مسیر نسبی باشند)
 */
export const DEFAULT_SKIP_FOLDERS: string[] = [
  // پوشه‌های رایج
  "node_modules",
  "vendor",
  ".git",
  ".idea",
  ".vscode",
  ".vs",
  "dist",
  "build",
  "coverage",
  "logs",

  // پوشه‌های Symfony
  "var/cache",
  "var/log",
  "var/sessions",
  "var/tmp",
  "public/bundles",

  // پوشه‌های Laravel
  "storage/app",
  "storage/framework/cache",
  "storage/framework/sessions",
  "storage/framework/testing",
  "storage/framework/views",
  "storage/logs",
  "bootstrap/cache",
  "public/storage",

  // پوشه‌های فریم‌ورک‌های جاوااسکریپت
  ".next",
  ".nuxt",
  "out",
  ".svelte-kit",
  ".angular",

  // پوشه‌های کش و بیلد
  ".cache",
  ".parcel-cache",
  ".webpack",
  ".turbo",
  ".vite",
  "temp",
  "tmp",
  "cache",
  ".phpunit.cache",
  ".php-cs-fixer.cache",

  // پوشه‌های تست
  ".nyc_output",
  "cypress/videos",
  "cypress/screenshots",
  ".cypress-cache",

  // بیلدهای عمومی
  "public/build",
  "public/hot",
  "public/css",
  "public/js",
  "public/mix-manifest.json",
];

/**
 * پسوندهایی که به عنوان فایل باینری شناخته می‌شوند
 * (محتوای آنها خوانده نمی‌شود، فقط نامشان در ساختار می‌آید)
 */
export const DEFAULT_SKIP_EXTENSIONS: string[] = [
  // تصاویر
  "jpg",
  "jpeg",
  "png",
  "gif",
  "bmp",
  "tiff",
  "webp",
  "svg",
  "ico",
  "psd",
  "ai",
  "eps",
  "raw",
  "xcf",
  // فایل‌های باینری اجرایی
  "exe",
  "dll",
  "so",
  "dylib",
  "bin",
  "obj",
  // پایگاه داده
  "db",
  "sqlite",
  "sqlite3",
  "mdb",
  // آرشیو
  "zip",
  "tar",
  "gz",
  "7z",
  "rar",
  // اسناد
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  // فونت
  "ttf",
  "otf",
  "woff",
  "woff2",
  // فایل‌های صوتی/تصویری (اختیاری)
  "mp3",
  "mp4",
  "avi",
  "mov",
  "wmv",
  "flv",
  "mkv",
];

/**
 * تشخیص فناوری‌های استفاده‌شده در پروژه بر اساس نام فایل‌ها
 */
export function detectTechnologies(files: FileEntry[]): string[] {
  const techs: string[] = [];
  const fileNames = files.map((f) => f.path.toLowerCase());

  const checks: [RegExp, string][] = [
    [/package\.json$/, "Node.js"],
    [/tsconfig\.json$/, "TypeScript"],
    [/webpack\.config\.(js|ts)$/, "Webpack"],
    [/vite\.config\.(js|ts)$/, "Vite"],
    [/\.jsx$/, "React"],
    [/\.vue$/, "Vue"],
    [/\.go$/, "Go"],
    [/\.py$/, "Python"],
    [/\.java$/, "Java"],
    [/requirements\.txt$/, "Python (pip)"],
    [/pom\.xml$/, "Maven"],
    [/gradle\.(build|settings)\./, "Gradle"],
    [/\.csproj$/, ".NET"],
    [/Dockerfile$/, "Docker"],
    [/docker-compose\.ya?ml$/, "Docker Compose"],
    [/\.tf$/, "Terraform"],
    [/\.rs$/, "Rust"],
    [/\.rb$/, "Ruby"],
    [/Gemfile$/, "Ruby (Bundler)"],
    [/\.php$/, "PHP"],
    [/composer\.json$/, "PHP (Composer)"],
  ];

  for (const [regex, name] of checks) {
    if (fileNames.some((f) => regex.test(f))) {
      techs.push(name);
    }
  }
  return [...new Set(techs)]; // حذف تکراری‌ها
}

/**
 * تولید نمای کلی پروژه
 */
export function generateOverview(files: FileEntry[]): string {
  const totalFiles = files.length;
  const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2) + " MB";

  const typeCount: Record<string, number> = {};
  files.forEach((f) => {
    const ext = f.path.split(".").pop()?.toLowerCase() || "";
    if (ext) {
      typeCount[ext] = (typeCount[ext] || 0) + 1;
    }
  });

  const technologies = detectTechnologies(files);

  let overview = "=".repeat(50) + "\n";
  overview += "PROJECT OVERVIEW\n";
  overview += "=".repeat(50) + "\n";
  overview += "\nProject Statistics:\n";
  overview += `Total Files: ${totalFiles}\n`;
  overview += `Total Size: ${totalSizeMB}\n\n`;
  overview += "File Types:\n";
  const sortedTypes = Object.entries(typeCount).sort((a, b) => b[1] - a[1]);
  for (const [ext, count] of sortedTypes) {
    overview += `  .${ext}: ${count} file${count !== 1 ? "s" : ""}\n`;
  }
  if (technologies.length > 0) {
    overview += "\nDetected Technologies:\n";
    for (const tech of technologies) {
      overview += `  - ${tech}\n`;
    }
  }
  overview += "\n";
  return overview;
}

/**
 * پاک‌سازی محتوا براساس پسوند فایل
 */
export function cleanContent(content: string, ext: string): string {
  if (["txt", "md", "json", "csv"].includes(ext)) {
    return content;
  }

  let lines = content.split("\n");

  lines = lines.map((line) => {
    const trimmed = line.trimEnd();

    if (
      ["js", "ts", "jsx", "tsx", "java", "c", "cpp", "cs", "go"].includes(ext)
    ) {
      const idx = trimmed.indexOf("//");
      if (idx >= 0 && !isInsideString(trimmed, idx)) {
        return trimmed.substring(0, idx).trimEnd();
      }
    } else if (["py", "rb", "sh", "bash"].includes(ext)) {
      const idx = trimmed.indexOf("#");
      if (idx >= 0 && !isInsideString(trimmed, idx)) {
        return trimmed.substring(0, idx).trimEnd();
      }
    } else if (["html", "xml", "xhtml"].includes(ext)) {
      return trimmed.replace(/<!--[\s\S]*?-->/g, "");
    } else if (["css", "scss", "less"].includes(ext)) {
      let l = trimmed.replace(/\/\*[\s\S]*?\*\//g, "");
      const idx = l.indexOf("//");
      if (idx >= 0) l = l.substring(0, idx).trimEnd();
      return l;
    } else if (ext === "sql") {
      let l = trimmed.replace(/\/\*[\s\S]*?\*\//g, "");
      const idx = l.indexOf("--");
      if (idx >= 0) l = l.substring(0, idx).trimEnd();
      return l;
    }
    return trimmed;
  });

  // حذف خطوط خالی اضافی (حداکثر یک خط خالی پشت سر هم)
  const cleaned: string[] = [];
  let lastWasEmpty = false;
  for (const line of lines) {
    if (line.trim() === "") {
      if (!lastWasEmpty) cleaned.push("");
      lastWasEmpty = true;
    } else {
      cleaned.push(line);
      lastWasEmpty = false;
    }
  }
  return cleaned.join("\n").trim();
}

function isInsideString(line: string, index: number): boolean {
  let inSingle = false,
    inDouble = false;
  for (let i = 0; i < index; i++) {
    if (line[i] === "'" && !inDouble) inSingle = !inSingle;
    if (line[i] === '"' && !inSingle) inDouble = !inDouble;
  }
  return inSingle || inDouble;
}

/**
 * تولید ساختار درختی پوشه از لیست فایل‌ها
 */
function generateTree(files: FileEntry[], root: string): string {
  const treeLines: string[] = [];
  const pathSet = new Set<string>();

  for (const f of files) {
    const parts = f.path.split("/");
    let current = "";
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        pathSet.add(current + part);
      } else {
        current += part + "/";
        pathSet.add(current);
      }
    }
  }

  const sorted = Array.from(pathSet).sort();
  const prefix = root.split("/").pop() || root;
  treeLines.push(prefix + "/");

  for (const p of sorted) {
    const depth = p.split("/").length;
    const indent = "  ".repeat(depth);
    const name = p.endsWith("/")
      ? p.slice(0, -1).split("/").pop() + "/"
      : p.split("/").pop() || "";
    treeLines.push(indent + name);
  }

  return treeLines.join("\n");
}

/**
 * قالب‌بندی نهایی خروجی شامل نمای کلی، ساختار و محتوای فایل‌ها
 */
export function formatOutput(
  files: FileEntry[],
  root: string,
  separator: string = "--- {filename} ---",
): string {
  const overview = generateOverview(files);
  const tree = generateTree(files, root);
  const parts: string[] = [];

  parts.push(overview);
  parts.push("=".repeat(50));
  parts.push("STRUCTURE");
  parts.push("=".repeat(50));
  parts.push(tree);
  parts.push("\n" + "=".repeat(50));
  parts.push("FILES");
  parts.push("=".repeat(50) + "\n");

  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

  for (const file of sortedFiles) {
    const header = separator.replace("{filename}", file.path);
    parts.push(header);

    if (file.error) {
      parts.push(`[ERROR: ${file.error}]`);
    } else if (file.isBinary) {
      parts.push(`[BINARY FILE - CONTENT SKIPPED] (${file.size} bytes)`);
    } else if (file.content !== undefined) {
      parts.push(file.content);
    } else {
      parts.push("[EMPTY OR UNREADABLE]");
    }
    parts.push("");
  }

  return parts.join("\n");
}
