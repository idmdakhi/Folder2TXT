// اجرای حالت توسعه دسکتاپ با همان تنظیمات بیلد (MinGW + تارگت GNU)
const path = require("path");
const { spawnSync } = require("child_process");
const { TARGET, buildRustEnv } = require("./rust-env");

const root = path.join(__dirname, "..");
const env = buildRustEnv();

const tauriCli = require.resolve("@tauri-apps/cli/tauri.js");
const args = [tauriCli, "dev", "--target", TARGET];

console.log(`\n> tauri ${args.slice(1).join(" ")}\n`);
const result = spawnSync(process.execPath, args, {
  cwd: root,
  env,
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status || 0);
