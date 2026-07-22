import { mkdtemp, rm } from "fs/promises";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";

interface Session {
  id: string;
  dir: string;
  createdAt: number;
}

const sessions = new Map<string, Session>();
const SESSION_TTL_MS = 1000 * 60 * 30; // 30 دقیقه

export async function createSession(): Promise<Session> {
  const id = randomUUID();
  const dir = await mkdtemp(path.join(os.tmpdir(), `repo2text-${id}-`));
  const session: Session = { id, dir, createdAt: Date.now() };
  sessions.set(id, session);
  return session;
}

export function getSession(id: string): Session | undefined {
  return sessions.get(id);
}

export async function destroySession(id: string): Promise<void> {
  const s = sessions.get(id);
  if (!s) return;
  sessions.delete(id);
  try {
    await rm(s.dir, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

// پاکسازی خودکار session های قدیمی
setInterval(async () => {
  const now = Date.now();
  for (const [id, s] of sessions.entries()) {
    if (now - s.createdAt > SESSION_TTL_MS) {
      await destroySession(id);
    }
  }
}, 1000 * 60 * 5).unref();
