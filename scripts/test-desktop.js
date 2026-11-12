// اجرای تست‌های Rust هسته دسکتاپ
const path = require("path");
const { spawnSync } = require("child_process");
const { TARGET, buildRustEnv } = require("./rust-env");

const root = path.join(__dirname, "..");
const env = buildRustEnv();
const cargo = env.CARGO || "cargo";

console.log(`\n> cargo test -p folder2txt-core --target ${TARGET}\n`);
const result = spawnSync(
  cargo,
  [
    "test",
    "-p",
    "folder2txt-core",
    "--manifest-path",
    path.join(root, "src-tauri", "Cargo.toml"),
    "--target",
    TARGET,
  ],
  { cwd: root, env, stdio: "inherit" },
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status || 0);
