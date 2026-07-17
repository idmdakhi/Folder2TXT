// assets/js/app.js
(function () {
  let selectedFiles = [];
  let fileTypeMap = {};

  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const browseBtn = document.getElementById('browseBtn');
  const processBtn = document.getElementById('processLocalBtn');
  const copyBtn = document.getElementById('copyLocalBtn');
  const statusMsg = document.getElementById('statusMessage');
  const progressBar = document.getElementById('progressBar');
  const progressFill = document.getElementById('progressFill');
  const fileList = document.getElementById('fileList');
  const fileTypeGrid = document.getElementById('fileTypeGrid');
  const fileTypesSection = document.getElementById('fileTypesSection');
  const selectAllBtn = document.getElementById('selectAllBtn');
  const deselectAllBtn = document.getElementById('deselectAllBtn');

  // گزینه‌ها
  const separatorInput = document.getElementById('separatorLocal');
  const outputNameInput = document.getElementById('outputName');
  const maxDepthInput = document.getElementById('maxDepthLocal');
  const ignorePatternsInput = document.getElementById('ignorePatternsLocal');
  const cleanModeCheck = document.getElementById('cleanModeLocal');
  const commonOnlyCheck = document.getElementById('commonOnlyLocal');

  let selectedTypes = new Set();

  // رویدادها
  browseBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFiles);

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('border-indigo-400', 'bg-indigo-50');
  });
  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('border-indigo-400', 'bg-indigo-50');
  });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-indigo-400', 'bg-indigo-50');
    if (e.dataTransfer.items) {
      const items = e.dataTransfer.items;
      if (items[0].webkitGetAsEntry) {
        const entries = [];
        for (let i = 0; i < items.length; i++) {
          const entry = items[i].webkitGetAsEntry();
          if (entry) entries.push(entry);
        }
        traverseEntries(entries);
        return;
      }
    }
    const files = e.dataTransfer.files;
    if (files.length) {
      handleFiles({ target: { files } });
    }
  });

  function handleFiles(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    selectedFiles = Array.from(files);
    buildFileTypes();
    updateUI();
    processBtn.disabled = false;
  }

  function traverseEntries(entries, path = '') {
    const allFiles = [];
    const queue = entries.map((entry) => ({ entry, path }));
    while (queue.length) {
      const { entry, path: currentPath } = queue.shift();
      if (entry.isFile) {
        entry.file((file) => {
          file.webkitRelativePath = currentPath
            ? currentPath + '/' + file.name
            : file.name;
          allFiles.push(file);
        });
      } else if (entry.isDirectory) {
        const reader = entry.createReader();
        reader.readEntries((subEntries) => {
          for (const sub of subEntries) {
            queue.push({
              entry: sub,
              path: currentPath ? currentPath + '/' + entry.name : entry.name,
            });
          }
        });
      }
    }
    // صبر برای جمع‌آوری همه فایل‌ها
    setTimeout(() => {
      selectedFiles = allFiles;
      buildFileTypes();
      updateUI();
      processBtn.disabled = false;
    }, 500);
  }

  function buildFileTypes() {
    fileTypeMap = {};
    for (const file of selectedFiles) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!fileTypeMap[ext]) fileTypeMap[ext] = [];
      fileTypeMap[ext].push(file);
    }
    renderFileTypes();
  }

  function renderFileTypes() {
    const extensions = Object.keys(fileTypeMap).sort();
    fileTypeGrid.innerHTML = '';
    if (extensions.length === 0) {
      fileTypesSection.classList.add('hidden');
      return;
    }
    fileTypesSection.classList.remove('hidden');
    for (const ext of extensions) {
      const count = fileTypeMap[ext].length;
      const div = document.createElement('label');
      div.className =
        'flex items-center gap-2 text-sm bg-white p-2 rounded shadow';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = ext;
      cb.checked = true;
      cb.addEventListener('change', () => {
        if (cb.checked) selectedTypes.add(ext);
        else selectedTypes.delete(ext);
      });
      selectedTypes.add(ext);
      div.appendChild(cb);
      div.appendChild(document.createTextNode(`.${ext} (${count})`));
      fileTypeGrid.appendChild(div);
    }
  }

  selectAllBtn.addEventListener('click', () => {
    document
      .querySelectorAll('#fileTypeGrid input[type="checkbox"]')
      .forEach((cb) => {
        cb.checked = true;
        selectedTypes.add(cb.value);
      });
  });
  deselectAllBtn.addEventListener('click', () => {
    document
      .querySelectorAll('#fileTypeGrid input[type="checkbox"]')
      .forEach((cb) => {
        cb.checked = false;
        selectedTypes.delete(cb.value);
      });
  });

  function updateUI() {
    if (selectedFiles.length === 0) {
      fileList.classList.add('hidden');
      return;
    }
    fileList.classList.remove('hidden');
    fileList.innerHTML = `<strong>${selectedFiles.length}</strong> فایل انتخاب شد.`;
  }

  // پردازش محلی
  processBtn.addEventListener('click', async () => {
    const separator = separatorInput.value || '--- {filename} ---';
    const outputName = outputNameInput.value || 'merged_files.txt';
    const maxDepth = parseInt(maxDepthInput.value) || Infinity;
    const ignorePatterns = ignorePatternsInput.value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const cleanMode = cleanModeCheck.checked;
    const commonOnly = commonOnlyCheck.checked;

    let filesToProcess = selectedFiles;
    // فیلتر بر اساس پسوندهای انتخاب شده
    if (selectedTypes.size > 0) {
      filesToProcess = filesToProcess.filter((f) => {
        const ext = f.name.split('.').pop().toLowerCase();
        return selectedTypes.has(ext);
      });
    }
    // فیلتر بر اساس عمق
    if (maxDepth < Infinity) {
      filesToProcess = filesToProcess.filter((f) => {
        const depth = (f.webkitRelativePath || f.name).split('/').length - 1;
        return depth <= maxDepth;
      });
    }
    // نادیده‌گیری الگوها
    if (ignorePatterns.length) {
      filesToProcess = filesToProcess.filter((f) => {
        const path = f.webkitRelativePath || f.name;
        return !ignorePatterns.some((pattern) => {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'));
          return regex.test(path);
        });
      });
    }
    // فقط انواع رایج
    const commonExtensions = [
      'js',
      'ts',
      'json',
      'html',
      'css',
      'md',
      'txt',
      'py',
      'java',
      'c',
      'cpp',
      'go',
      'rs',
    ];
    if (commonOnly) {
      filesToProcess = filesToProcess.filter((f) => {
        const ext = f.name.split('.').pop().toLowerCase();
        return commonExtensions.includes(ext);
      });
    }

    if (filesToProcess.length === 0) {
      showStatus('هیچ فایلی برای پردازش یافت نشد.', 'error');
      return;
    }

    processBtn.disabled = true;
    progressBar.classList.remove('hidden');
    progressFill.style.width = '0%';
    showStatus(`در حال پردازش ${filesToProcess.length} فایل...`, 'info');

    let output = '';
    let count = 0;
    for (const file of filesToProcess) {
      try {
        const content = await readFileContent(file);
        const header = separator.replace(
          /\{filename\}/g,
          file.webkitRelativePath || file.name,
        );
        let body = content;
        if (cleanMode) {
          body = body.replace(/\/\*[\s\S]*?\*\//g, ''); // حذف کامنت‌های بلوکی
          body = body.replace(/^\s*\/\/.*$/gm, ''); // حذف کامنت‌های خطی
          body = body.replace(/^\s*#.*$/gm, ''); // حذف کامنت‌های هش
          body = body.replace(/[ \t]+$/gm, ''); // حذف فاصله انتهای خط
          body = body.replace(/\n{3,}/g, '\n\n'); // فشرده‌سازی خطوط خالی
        }
        output += header + '\n' + body + '\n\n';
        count++;
        progressFill.style.width = `${(count / filesToProcess.length) * 100}%`;
      } catch (err) {
        showStatus(`خطا در خواندن ${file.name}: ${err.message}`, 'error');
      }
    }

    progressFill.style.width = '100%';
    showStatus(`پردازش کامل شد. ${count} فایل ادغام شد.`, 'success');

    // دانلود
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = outputName;
    a.click();
    URL.revokeObjectURL(url);

    // دکمه کپی
    copyBtn.classList.remove('hidden');
    copyBtn.onclick = () => {
      navigator.clipboard
        .writeText(output)
        .then(() => {
          showStatus('متن کپی شد!', 'success');
        })
        .catch(() => {
          showStatus('کپی ناموفق', 'error');
        });
    };

    processBtn.disabled = false;
  });

  function readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  function showStatus(msg, type = 'info') {
    statusMsg.classList.remove(
      'hidden',
      'bg-blue-50',
      'bg-red-50',
      'bg-green-50',
      'text-blue-700',
      'text-red-700',
      'text-green-700',
    );
    const colors = {
      info: 'bg-blue-50 text-blue-700',
      error: 'bg-red-50 text-red-700',
      success: 'bg-green-50 text-green-700',
    };
    statusMsg.className = `status-message p-3 rounded-lg mb-4 ${colors[type] || colors.info}`;
    statusMsg.textContent = msg;
  }
})();
