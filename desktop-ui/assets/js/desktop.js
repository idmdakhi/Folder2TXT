// پل ارتباطی رابط کاربری با هسته Rust در حالت Tauri
(function () {
  const tauri = window.__TAURI__;
  const form = document.getElementById("serverForm");
  const pathInput = document.getElementById("folderPath");
  const pickButton = document.getElementById("pickFolderBtn");
  const processButton = document.getElementById("serverProcessBtn");
  const statusElement = document.getElementById("desktopStatus");

  if (!tauri || !tauri.core || !tauri.core.invoke) {
    // اجرا در مرورگر عادی: بخش دسکتاپ غیرفعال می‌شود
    if (processButton) processButton.disabled = true;
    if (pickButton) pickButton.disabled = true;
    return;
  }

  const invoke = tauri.core.invoke;
  let statusTimer = null;

  function showStatus(message, type) {
    if (!statusElement) return;
    statusElement.className = `status-message mt-4 p-3 rounded-lg ${type}`;
    statusElement.textContent = message;
    statusElement.style.display = "block";

    if (statusTimer) clearTimeout(statusTimer);
    if (type !== "processing") {
      statusTimer = setTimeout(() => {
        statusElement.style.display = "none";
      }, 6000);
    }
  }

  async function chooseFolder() {
    try {
      const selected = await invoke("pick_folder");
      if (selected) {
        pathInput.value = selected;
        showStatus("پوشه انتخاب شد. حالا دکمه پردازش را بزنید.", "success");
      }
    } catch (error) {
      showStatus(`انتخاب پوشه ناموفق بود: ${error}`, "error");
    }
  }

  // تابع مشترک ذخیره برای بخش پردازش محلی (کشیدن و رها کردن)
  window.__saveTextFile = async function (content, filename) {
    try {
      return await invoke("save_output", {
        defaultName: filename || "merged_files.txt",
        content,
      });
    } catch (error) {
      showStatus(`ذخیره فایل ناموفق بود: ${error}`, "error");
      return null;
    }
  };

  pickButton.addEventListener("click", chooseFolder);
  pathInput.addEventListener("click", chooseFolder);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const folderPath = pathInput.value.trim();
    if (!folderPath) {
      showStatus("ابتدا یک پوشه انتخاب کنید.", "error");
      return;
    }

    const splitValues = (value) =>
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

    const maxDepthValue = document
      .getElementById("serverMaxDepth")
      .value.trim();

    const options = {
      folderPath,
      selectedTypes: splitValues(
        document.getElementById("serverSelectedTypes").value,
      ),
      cleanMode: form.querySelector('input[name="cleanMode"]').checked,
      separator:
        document.getElementById("serverSeparator").value ||
        "--- {filename} ---",
      commonOnly: form.querySelector('input[name="commonOnly"]').checked,
      maxDepth: maxDepthValue ? parseInt(maxDepthValue, 10) : null,
      ignorePatterns: splitValues(
        document.getElementById("serverIgnorePatterns").value,
      ),
      useGitignore: form.querySelector('input[name="useGitignore"]').checked,
    };

    const outputName =
      document.getElementById("serverOutputName").value.trim() ||
      "merged_files.txt";

    processButton.disabled = true;
    showStatus("در حال پردازش پوشه...", "processing");

    try {
      const result = await invoke("process_folder", { options });

      showStatus("پردازش انجام شد؛ محل ذخیره را انتخاب کنید...", "processing");
      const savedPath = await invoke("save_output", {
        defaultName: outputName,
        content: result.content,
      });

      if (savedPath) {
        showStatus(
          `✅ ${result.fileCount} فایل پردازش و در «${savedPath}» ذخیره شد.`,
          "success",
        );
      } else {
        showStatus("پردازش انجام شد ولی ذخیره فایل لغو شد.", "error");
      }
    } catch (error) {
      showStatus(`خطا در پردازش: ${error}`, "error");
    } finally {
      processButton.disabled = false;
    }
  });
})();
