import { simpleGit } from "simple-git";

const ALLOWED_PROTOCOLS = ["https://", "http://"];

export function isValidGitUrl(url: string): boolean {
  return ALLOWED_PROTOCOLS.some((p) => url.startsWith(p));
}

export async function cloneRepo(url: string, destDir: string, branch?: string): Promise<void> {
  if (!isValidGitUrl(url)) {
    throw new Error("فقط آدرس‌های http/https مجاز هستند");
  }
  const git = simpleGit();
  const args = ["--depth", "1"];
  if (branch) args.push("--branch", branch);
  await git.clone(url, destDir, args);
}
