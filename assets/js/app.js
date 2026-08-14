// public/assets/js/app.js
(function () {
  // ==================== توابع هسته (مشترک با سرور) ====================
  const DEFAULT_SKIP_FILES = [
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
  const DEFAULT_SKIP_FOLDERS = [
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

  const DEFAULT_SKIP_EXTENSIONS = [
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

  function matchesWildcard(pattern, text) {
    if (!pattern.includes("*")) {
      return pattern === text;
    }
    const regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*");
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(text);
  }

  function detectTechnologies(files) {
    const techs = [];
    const fileNames = files.map((f) => f.path.toLowerCase());
    const checks = [
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
      if (fileNames.some((f) => regex.test(f))) techs.push(name);
    }
    return [...new Set(techs)];
  }

  function generateOverview(files) {
    const totalFiles = files.length;
    const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2) + " MB";

    const typeCount = {};
    files.forEach((f) => {
      const ext = f.path.split(".").pop()?.toLowerCase() || "";
      if (ext) typeCount[ext] = (typeCount[ext] || 0) + 1;
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
      for (const tech of technologies) overview += `  - ${tech}\n`;
    }
    overview += "\n";
    return overview;
  }

  function cleanContent(content, ext) {
    if (["txt", "md", "json", "csv"].includes(ext)) return content;

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

    const cleaned = [];
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

  function isInsideString(line, index) {
    let inSingle = false,
      inDouble = false;
    for (let i = 0; i < index; i++) {
      if (line[i] === "'" && !inDouble) inSingle = !inSingle;
      if (line[i] === '"' && !inSingle) inDouble = !inDouble;
    }
    return inSingle || inDouble;
  }

  function generateTree(files, root) {
    const treeLines = [];
    const pathSet = new Set();

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

  function formatOutput(files, root, separator = "--- {filename} ---") {
    const overview = generateOverview(files);
    const tree = generateTree(files, root);
    const parts = [];

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

  // ==================== کلاس اصلی کلاینت ====================
  class FolderTextMerger {
    constructor() {
      this.files = [];
      this.selectedTypes = new Set();
      this.mergedContent = "";
      this.commonFileTypes = new Set([
        "txt",
        "js",
        "py",
        "json",
        "md",
        "html",
        "htm",
        "css",
        "yaml",
        "yml",
        "xml",
        "sql",
        "gradle",
        "kt",
      ]);
      this.init();
    }

    init() {
      this.setupEventListeners();
    }

    setupEventListeners() {
      const dropZone = document.getElementById("dropZone");
      const fileInput = document.getElementById("fileInput");
      const processBtn = document.getElementById("processLocalBtn");
      const copyBtn = document.getElementById("copyLocalBtn");
      const previewBtn = document.getElementById("previewLocalBtn");
      const commonOnlyCheckbox = document.getElementById("commonOnlyLocal");
      const ignorePatternsInput = document.getElementById(
        "ignorePatternsLocal",
      );
      const maxDepthInput = document.getElementById("maxDepthLocal");

      // دکمه معکوس کردن انتخاب
      const invertSelectionBtn = document.getElementById("invertSelectionBtn");
      if (invertSelectionBtn) {
        invertSelectionBtn.addEventListener("click", () =>
          this.invertSelection(),
        );
      }

      // دکمه‌های مودال پیش‌نمایش
      const closePreviewBtn = document.getElementById("closePreviewBtn");
      const previewModal = document.getElementById("previewModal");
      const downloadFromPreviewBtn = document.getElementById(
        "downloadFromPreviewBtn",
      );

      if (closePreviewBtn) {
        closePreviewBtn.addEventListener("click", () => {
          previewModal.classList.add("hidden");
        });
      }

      if (previewModal) {
        previewModal.addEventListener("click", (e) => {
          if (e.target === previewModal) {
            previewModal.classList.add("hidden");
          }
        });
      }

      if (downloadFromPreviewBtn) {
        downloadFromPreviewBtn.addEventListener("click", () => {
          const outputName =
            document.getElementById("outputName").value || "merged_files.txt";
          this.downloadFile(this.mergedContent, outputName);
        });
      }

      dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("drag-over");
      });
      dropZone.addEventListener("dragleave", () =>
        dropZone.classList.remove("drag-over"),
      );
      dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("drag-over");
        this.handleFiles(e.dataTransfer.items);
      });

      fileInput.addEventListener("change", (e) =>
        this.handleFileInput(e.target.files),
      );

      processBtn.addEventListener("click", () => this.processFiles());
      copyBtn.addEventListener("click", () => this.copyToClipboard());
      previewBtn.addEventListener("click", () => this.showPreview());

      commonOnlyCheckbox.addEventListener("change", () =>
        this.renderFoundFileTypes(),
      );
      ignorePatternsInput.addEventListener("input", () =>
        this.renderFoundFileTypes(),
      );
      maxDepthInput.addEventListener("input", () =>
        this.renderFoundFileTypes(),
      );

      document
        .getElementById("selectAllBtn")
        .addEventListener("click", () => this.selectAllTypes());
      document
        .getElementById("deselectAllBtn")
        .addEventListener("click", () => this.deselectAllTypes());
    }

    handleFiles(items) {
      this.files = [];
      const promises = [];
      for (let item of items) {
        if (item.kind === "file") {
          const entry = item.webkitGetAsEntry();
          if (entry) promises.push(this.traverseFileTree(entry));
        }
      }
      Promise.all(promises).then(() => {
        this.renderFoundFileTypes();
        this.updateProcessButton();
        this.showStatus(
          `تعداد فایل‌های یافت‌شده: ${this.files.length}`,
          "success",
        );
      });
    }

    // اصلاح مهم: تبدیل FileList به ساختار داخلی یکسان با traverseFileTree
    handleFileInput(fileList) {
      this.files = Array.from(fileList).map((file) => {
        const relativePath = file.webkitRelativePath || file.name;
        const skipFile = this.shouldSkipFile(file.name, relativePath);
        return {
          path: relativePath,
          content: null,
          isBinary: skipFile,
          size: file.size,
          error: null,
          file: file,
        };
      });
      this.renderFoundFileTypes();
      this.updateProcessButton();
      this.showStatus(
        `تعداد فایل‌های یافت‌شده: ${this.files.length}`,
        "success",
      );
    }

    shouldSkipFolder(relativePath) {
      const normalized = relativePath.endsWith("/")
        ? relativePath.slice(0, -1)
        : relativePath;
      if (DEFAULT_SKIP_FOLDERS.includes(normalized)) return true;
      for (const folder of DEFAULT_SKIP_FOLDERS) {
        if (normalized.startsWith(folder + "/") || normalized === folder)
          return true;
      }
      return false;
    }

    shouldSkipFile(fileName, relativePath) {
      for (const pattern of DEFAULT_SKIP_FILES) {
        if (matchesWildcard(pattern, fileName)) return true;
      }
      const ext = fileName.split(".").pop()?.toLowerCase() || "";
      if (DEFAULT_SKIP_EXTENSIONS.includes(ext)) return true;
      return false;
    }

    traverseFileTree(item, path = "") {
      return new Promise((resolve) => {
        if (item.isFile) {
          item.file(resolve);
        } else if (item.isDirectory) {
          // نادیده گرفتن پوشه‌های ممنوعه بر اساس نام
          if (DEFAULT_SKIP_FOLDERS.includes(item.name)) {
            resolve();
            return;
          }
          const dirPath = path + item.name + "/";
          const dirReader = item.createReader();
          const readEntries = () => {
            dirReader.readEntries((entries) => {
              if (entries.length === 0) {
                resolve();
              } else {
                const promises = entries.map((entry) =>
                  this.traverseFileTree(entry, dirPath),
                );
                Promise.all(promises).then(() => readEntries());
              }
            });
          };
          readEntries();
        } else {
          resolve();
        }
      }).then((file) => {
        if (file) {
          const relativePath = path + file.name;
          if (this.shouldSkipFolder(relativePath)) return;
          const skipFile = this.shouldSkipFile(file.name, relativePath);
          const entry = {
            path: relativePath,
            content: null,
            isBinary: skipFile,
            size: file.size,
            error: null,
            file: file,
          };
          this.files.push(entry);
        }
      });
    }

    getBaseFilteredFiles() {
      const commonOnly = document.getElementById("commonOnlyLocal").checked;
      const maxDepthInput = document.getElementById("maxDepthLocal");
      const maxDepth = maxDepthInput.value
        ? parseInt(maxDepthInput.value, 10)
        : undefined;
      const ignorePatterns = document
        .getElementById("ignorePatternsLocal")
        .value.split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      return this.files.filter((file) => {
        if (commonOnly) {
          const ext = this.getFileExtension(file.path);
          if (!this.commonFileTypes.has(ext)) return false;
        }
        if (maxDepth !== undefined) {
          const depth = file.path.split("/").length - 1;
          if (depth > maxDepth) return false;
        }
        for (const pattern of ignorePatterns) {
          if (matchesWildcard(pattern, file.path)) return false;
        }
        return true;
      });
    }

    applyFilters(files) {
      const commonOnly = document.getElementById("commonOnlyLocal").checked;
      const maxDepthInput = document.getElementById("maxDepthLocal");
      const maxDepth = maxDepthInput.value
        ? parseInt(maxDepthInput.value, 10)
        : undefined;
      const ignorePatterns = document
        .getElementById("ignorePatternsLocal")
        .value.split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      return files.filter((file) => {
        const ext = this.getFileExtension(file.path);
        if (!this.selectedTypes.has(ext)) return false;
        if (commonOnly && !this.commonFileTypes.has(ext)) return false;
        if (maxDepth !== undefined) {
          const depth = file.path.split("/").length - 1;
          if (depth > maxDepth) return false;
        }
        for (const pattern of ignorePatterns) {
          if (matchesWildcard(pattern, file.path)) return false;
        }
        return true;
      });
    }

    renderFoundFileTypes() {
      const grid = document.getElementById("fileTypeGrid");
      grid.innerHTML = "";
      this.selectedTypes.clear();

      if (this.files.length === 0) {
        grid.innerHTML =
          '<p class="text-center text-gray-500 col-span-full">پوشه‌ای انتخاب نشده است.</p>';
        return;
      }

      const baseFiltered = this.getBaseFilteredFiles();

      const typeCounts = {};
      baseFiltered.forEach((file) => {
        const ext = this.getFileExtension(file.path);
        if (ext) {
          typeCounts[ext] = (typeCounts[ext] || 0) + 1;
        }
      });

      const foundTypes = Object.keys(typeCounts);
      if (foundTypes.length === 0) {
        grid.innerHTML =
          '<p class="text-center text-gray-500 col-span-full">هیچ فایلی با فیلترهای جاری یافت نشد.</p>';
        return;
      }

      foundTypes.sort().forEach((type) => {
        const item = document.createElement("div");
        item.className = "file-type-item animate-fade-in";
        item.innerHTML = `
          <input type="checkbox" id="type-${type}" value="${type}" checked class="w-4 h-4 text-indigo-600 rounded transition">
          <label for="type-${type}" class="cursor-pointer flex-1">.${type}</label>
          <span class="file-count">${typeCounts[type]}</span>
        `;
        const checkbox = item.querySelector("input");
        checkbox.addEventListener("change", (e) => {
          if (e.target.checked) this.selectedTypes.add(type);
          else this.selectedTypes.delete(type);
          this.updateProcessButton();
          this.showFileList();
          this.updateStats();
        });
        this.selectedTypes.add(type);
        grid.appendChild(item);
      });

      this.showFileList();
      this.updateStats();
    }

    showFileList() {
      const fileList = document.getElementById("fileList");
      if (this.files.length === 0) {
        fileList.style.display = "none";
        return;
      }
      fileList.style.display = "block";
      fileList.innerHTML =
        '<h4 class="font-semibold mb-3">فایل‌های قابل پردازش (پس از اعمال فیلترها):</h4>';

      const filtered = this.applyFilters(this.files);

      filtered.slice(0, 50).forEach((file) => {
        const item = document.createElement("div");
        item.className = "file-list-item text-sm";
        item.textContent = file.path;
        fileList.appendChild(item);
      });

      if (filtered.length > 50) {
        const more = document.createElement("div");
        more.className = "file-list-item text-sm italic";
        more.textContent = `... و ${filtered.length - 50} فایل دیگر`;
        fileList.appendChild(more);
      }
    }

    getFileExtension(filename) {
      const parts = filename.split(".");
      return parts.length > 1 ? parts.pop().toLowerCase() : "";
    }

    updateProcessButton() {
      const processBtn = document.getElementById("processLocalBtn");
      const filtered = this.applyFilters(this.files);
      processBtn.disabled = !(
        filtered.length > 0 && this.selectedTypes.size > 0
      );
    }

    showStatus(message, type) {
      const status = document.getElementById("statusMessage");
      status.className = `status-message p-3 rounded-lg mb-4 ${type}`;
      status.textContent = message;
      status.style.display = "block";
      if (type !== "processing") {
        setTimeout(() => {
          status.style.display = "none";
        }, 5000);
      }
    }

    async processFiles() {
      const separator = document.getElementById("separatorLocal").value;
      const outputName =
        document.getElementById("outputName").value || "merged_files.txt";
      const cleanMode = document.getElementById("cleanModeLocal").checked;
      const filteredFiles = this.applyFilters(this.files);

      if (filteredFiles.length === 0) {
        this.showStatus("هیچ فایلی برای پردازش وجود ندارد.", "error");
        return;
      }

      const progressBar = document.getElementById("progressBar");
      const progressFill = document.getElementById("progressFill");
      const processBtn = document.getElementById("processLocalBtn");
      const copyBtn = document.getElementById("copyLocalBtn");

      progressBar.style.display = "block";
      processBtn.disabled = true;
      this.showStatus("در حال ادغام فایل‌ها...", "processing");

      for (let i = 0; i < filteredFiles.length; i++) {
        const file = filteredFiles[i];
        if (!file.isBinary && !file.content && file.file) {
          try {
            const content = await this.readFile(file.file);
            file.content = content;
          } catch (error) {
            file.error = error.message;
          }
        }
        const progress = ((i + 1) / filteredFiles.length) * 100;
        progressFill.style.width = progress + "%";
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      if (cleanMode) {
        for (const file of filteredFiles) {
          if (file.content) {
            const ext = this.getFileExtension(file.path);
            file.content = cleanContent(file.content, ext);
          }
        }
      }

      const output = formatOutput(filteredFiles, "folder", separator);
      this.mergedContent = output;

      copyBtn.style.display = "block";
      this.downloadFile(output, outputName);

      this.showStatus(
        `✅ ${filteredFiles.length} فایل با موفقیت ادغام شد.`,
        "success",
      );
      progressBar.style.display = "none";
      processBtn.disabled = false;
    }

    readFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
      });
    }

    downloadFile(content, filename) {
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    copyToClipboard() {
      navigator.clipboard
        .writeText(this.mergedContent)
        .then(() => {
          this.showStatus("📋 محتوا در کلیپ‌بورد کپی شد!", "success");
        })
        .catch((err) => {
          this.showStatus("❌ کپی ناموفق", "error");
          console.error("Copy failed:", err);
        });
    }

    selectAllTypes() {
      document
        .querySelectorAll('#fileTypeGrid input[type="checkbox"]')
        .forEach((cb) => {
          cb.checked = true;
          this.selectedTypes.add(cb.value);
        });
      this.updateProcessButton();
      this.showFileList();
    }

    deselectAllTypes() {
      document
        .querySelectorAll('#fileTypeGrid input[type="checkbox"]')
        .forEach((cb) => {
          cb.checked = false;
          this.selectedTypes.delete(cb.value);
        });
      this.updateProcessButton();
      this.showFileList();
      this.updateStats();
    }

    invertSelection() {
      document
        .querySelectorAll('#fileTypeGrid input[type="checkbox"]')
        .forEach((cb) => {
          cb.checked = !cb.checked;
          if (cb.checked) {
            this.selectedTypes.add(cb.value);
          } else {
            this.selectedTypes.delete(cb.value);
          }
        });
      this.updateProcessButton();
      this.showFileList();
      this.updateStats();
    }

    updateStats() {
      const statsSection = document.getElementById("statsSection");
      if (!statsSection || this.files.length === 0) {
        if (statsSection) statsSection.classList.add("hidden");
        return;
      }

      statsSection.classList.remove("hidden");

      const totalFiles = this.files.length;
      const filtered = this.applyFilters(this.files);
      const selectedFiles = filtered.length;
      const totalSize = filtered.reduce((sum, f) => sum + (f.size || 0), 0);
      const fileTypes = this.selectedTypes.size;

      // فرمت‌بندی حجم
      let sizeText = "";
      if (totalSize < 1024) {
        sizeText = totalSize + " B";
      } else if (totalSize < 1024 * 1024) {
        sizeText = (totalSize / 1024).toFixed(1) + " KB";
      } else {
        sizeText = (totalSize / (1024 * 1024)).toFixed(2) + " MB";
      }

      // بروزرسانی کارت‌های آمار با انیمیشن
      this.animateValue("statTotalFiles", totalFiles);
      this.animateValue("statSelectedFiles", selectedFiles);
      document.getElementById("statTotalSize").textContent = sizeText;
      this.animateValue("statFileTypes", fileTypes);
    }

    animateValue(elementId, targetValue) {
      const element = document.getElementById(elementId);
      if (!element) return;

      const duration = 500;
      const startValue = parseInt(element.textContent.replace(/,/g, "")) || 0;
      const increment = (targetValue - startValue) / (duration / 16);
      let currentValue = startValue;

      const timer = setInterval(() => {
        currentValue += increment;
        if ((increment > 0 && currentValue >= targetValue) || 
            (increment < 0 && currentValue <= targetValue)) {
          currentValue = targetValue;
          clearInterval(timer);
        }
        element.textContent = Math.round(currentValue).toLocaleString("fa-IR");
      }, 16);
    }

    showPreview() {
      const modal = document.getElementById("previewModal");
      const previewContent = document.getElementById("previewContent");
      
      if (!modal || !previewContent) return;

      previewContent.textContent = this.mergedContent;
      modal.classList.remove("hidden");
    }

    showStatus(message, type) {
      const status = document.getElementById("statusMessage");
      const statusIcon = document.getElementById("statusIcon");
      const statusText = document.getElementById("statusText");
      
      if (!status) return;

      const icons = {
        success: "fa-check-circle",
        error: "fa-exclamation-circle",
        processing: "fa-spinner fa-spin",
        info: "fa-info-circle",
      };

      status.className = `status-message p-3 rounded-lg mb-4 flex items-center gap-2 ${type}`;
      if (statusIcon) statusIcon.className = `fas ${icons[type] || "fa-info-circle"}`;
      if (statusText) statusText.textContent = message;
      
      status.style.display = "flex";
      if (type !== "processing") {
        setTimeout(() => {
          status.style.display = "none";
        }, 5000);
      }
    }
}

  new FolderTextMerger();
})();
