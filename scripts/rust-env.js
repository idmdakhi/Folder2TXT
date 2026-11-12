// آماده‌سازی محیط Rust برای بیلد/تست نسخه دسکتاپ با MinGW
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const TARGET = "x86_64-pc-windows-gnu";
const GNU_HOST_TOOLCHAIN = "stable-x86_64-pc-windows-gnu";

function findMingwBin() {
  const candidates = [
    path.join(process.env.USERPROFILE || "", "scoop", "apps", "mingw", "current", "bin"),
    "C:\\msys64\\mingw64\\bin",
    "C:\\mingw64\\bin",
    "C:\\mingw32\\bin",
  ];
  return candidates.find((candidate) => fs.existsSync(path.join(candidate, "gcc.exe")));
}

function findCargoBin() {
  const candidates = [
    path.join(process.env.USERPROFILE || "", ".cargo", "bin"),
    path.join(process.env.USERPROFILE || "", "scoop", "apps", "rustup", "current", ".cargo", "bin"),
    path.join(process.env.CARGO_HOME || "", "bin"),
    "C:\\Program Files\\Rust stable\\.cargo\\bin",
    "C:\\Rust\\.cargo\\bin",
  ];
  return candidates.find(
    (candidate) => candidate && fs.existsSync(path.join(candidate, "cargo.exe")),
  );
}

function buildRustEnv() {
  const env = { ...process.env };

  if (process.platform !== "win32") return env;

  // Tauri CLI برای پیدا کردن cargo به مسیر صریح نیاز دارد
  const cargoBin = findCargoBin();
  if (cargoBin) {
    env.PATH = `${cargoBin};${env.PATH}`;
    env.CARGO = path.join(cargoBin, "cargo.exe");
    console.log(`Using Cargo from: ${cargoBin}`);
  }

  const mingwBin = findMingwBin();
  if (mingwBin) {
    env.PATH = `${mingwBin};${env.PATH}`;
    console.log(`Using MinGW from: ${mingwBin}`);

    const gcc = path.join(mingwBin, "gcc.exe");
    const ar = path.join(mingwBin, "ar.exe");
    env.CARGO_TARGET_X86_64_PC_WINDOWS_GNU_LINKER = gcc;
    env.CC_x86_64_pc_windows_gnu = gcc;
    env.AR_x86_64_pc_windows_gnu = ar;
  } else {
    const gccCheck = spawnSync("gcc", ["--version"], { env, stdio: "ignore" });
    if (gccCheck.status !== 0) {
      console.error(
        "MinGW (gcc) not found. Install it with `scoop install mingw` or add its bin folder to PATH.",
      );
      process.exit(1);
    }
  }

  // build-scriptها با toolchain میزبان کامپایل می‌شوند؛ برای تارگت GNU
  // میزبان GNU لازم است تا به link.exe نیاز نداشته باشیم.
  const toolchains = spawnSync("rustup", ["toolchain", "list"], {
    env,
    encoding: "utf8",
  });
  if (toolchains.status === 0 && (toolchains.stdout || "").includes(GNU_HOST_TOOLCHAIN)) {
    env.RUSTUP_TOOLCHAIN = GNU_HOST_TOOLCHAIN;
    console.log(`Using Rust host toolchain: ${GNU_HOST_TOOLCHAIN}`);
  } else {
    console.warn(
      `warning: ${GNU_HOST_TOOLCHAIN} is not installed. Run:\n  rustup toolchain install ${GNU_HOST_TOOLCHAIN} --profile minimal`,
    );
  }

  return env;
}

module.exports = { TARGET, GNU_HOST_TOOLCHAIN, buildRustEnv };
