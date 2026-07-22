import { AnalyzeResult, GenerateResult, Repo2TextConfig } from "./types";

const BASE = "/api";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || "خطای ناشناخته در ارتباط با سرور");
  }
  return res.json() as Promise<T>;
}

export async function cloneRepo(url: string, branch?: string): Promise<{ sessionId: string }> {
  const res = await fetch(`${BASE}/clone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, branch }),
  });
  return handle(res);
}

export async function uploadZip(file: File): Promise<{ sessionId: string }> {
  const form = new FormData();
  form.append("archive", file);
  const res = await fetch(`${BASE}/upload`, { method: "POST", body: form });
  return handle(res);
}

export async function analyzeSession(
  sessionId: string,
  config: Repo2TextConfig
): Promise<AnalyzeResult> {
  const res = await fetch(`${BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, config }),
  });
  return handle(res);
}

export async function generateText(
  sessionId: string,
  config: Repo2TextConfig,
  selectedPaths: string[]
): Promise<GenerateResult> {
  const res = await fetch(`${BASE}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, config, selectedPaths }),
  });
  return handle(res);
}

export async function closeSession(sessionId: string): Promise<void> {
  await fetch(`${BASE}/session/${sessionId}`, { method: "DELETE" });
}
