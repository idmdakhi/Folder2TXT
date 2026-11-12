// کپی خروجی بیلد Tauri به پوشه release
const fs = require("fs");
const path = require("path");

const projectRoot = path.join(__dirname, "..");
const targetRoot = path.join(projectRoot, "src-tauri", "target");

const candidates = [
  {
    exe: path.join(targetRoot, "x86_64-pc-windows-gnu", "release", "folder2txt-desktop.exe"),
    needsWebView2Loader: true,
  },
  {
    exe: path.join(targetRoot, "x86_64-pc-windows-msvc", "release", "folder2txt-desktop.exe"),
    needsWebView2Loader: false,
  },
  {
    exe: path.join(targetRoot, "release", "folder2txt-desktop.exe"),
    needsWebView2Loader: false,
  },
];

const build = candidates.find((candidate) => fs.existsSync(candidate.exe));
if (!build) {
  console.error("Desktop executable not found. Run the Tauri build first.");
  process.exit(1);
}

// پیدا کردن WebView2Loader.dll (نسخه x64) در خروجی بیلد
function findWebView2Loader(dir, depth = 0) {
  if (depth > 6) return null;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return null;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.toLowerCase() === "x64") {
      const dll = path.join(dir, entry.name, "WebView2Loader.dll");
      if (fs.existsSync(dll)) return dll;
    }
    const found = findWebView2Loader(path.join(dir, entry.name), depth + 1);
    if (found) return found;
  }
  return null;
}

const releaseDir = path.join(projectRoot, "release");
fs.mkdirSync(releaseDir, { recursive: true });

const destination = path.join(releaseDir, "Folder2Txt.exe");
fs.copyFileSync(build.exe, destination);

const sizeMb = (fs.statSync(destination).size / (1024 * 1024)).toFixed(1);
console.log(`Copied ${build.exe}\n     -> ${destination} (${sizeMb} MB)`);

if (build.needsWebView2Loader) {
  const buildDir = path.join(path.dirname(build.exe), "build");
  const loader = findWebView2Loader(buildDir);
  if (!loader) {
    console.error(
      "warning: WebView2Loader.dll not found in the build output; the app will not start without it.",
    );
  } else {
    const loaderDestination = path.join(releaseDir, "WebView2Loader.dll");
    fs.copyFileSync(loader, loaderDestination);
    console.log(`Copied ${loader}\n     -> ${loaderDestination}`);
  }
}
