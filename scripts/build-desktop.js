// بیلد نسخه دسکتاپ Tauri با تارگت GNU (بدون نیاز به Visual Studio)
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { TARGET, buildRustEnv } = require("./rust-env");

const root = path.join(__dirname, "..");
const env = buildRustEnv();

const iconPath = path.join(root, "src-tauri", "icons", "icon.ico");
if (!fs.existsSync(iconPath)) {
  console.log("Generating icons...");
  const icons = spawnSync(process.execPath, [path.join(__dirname, "make-icons.js")], {
    stdio: "inherit",
  });
  if (icons.status !== 0) process.exit(icons.status || 1);
}

const tauriCli = require.resolve("@tauri-apps/cli/tauri.js");
const args = [tauriCli, "build", "--no-bundle", "--target", TARGET];

console.log(`\n> tauri ${args.slice(1).join(" ")}\n`);
const build = spawnSync(process.execPath, args, {
  cwd: root,
  env,
  stdio: "inherit",
});

if (build.error) {
  console.error(build.error.message);
  process.exit(1);
}
if (build.status !== 0) process.exit(build.status || 1);

const copy = spawnSync(process.execPath, [path.join(__dirname, "copy-desktop-exe.js")], {
  cwd: root,
  env,
  stdio: "inherit",
});

process.exit(copy.status || 0);
