const WINDOWS_SEPARATOR = '\\';
const POSIX_SEPARATOR = '/';

export function normalizePath(path: string): string {
  if (!path) return '';
  return path
    .replaceAll(WINDOWS_SEPARATOR, POSIX_SEPARATOR)
    .replace(/\/+/g, POSIX_SEPARATOR)
    .replace(/^\.\//, '')
    .replace(/\/$/, '');
}

export function dirname(path: string): string {
  const normalized = normalizePath(path);
  const index = normalized.lastIndexOf(POSIX_SEPARATOR);
  if (index < 0) return '';
  return normalized.slice(0, index);
}

export function basename(path: string): string {
  const normalized = normalizePath(path);
  const index = normalized.lastIndexOf(POSIX_SEPARATOR);
  return index < 0 ? normalized : normalized.slice(index + 1);
}

export function extension(path: string): string {
  const name = basename(path);
  const index = name.lastIndexOf('.');
  return index < 0 ? '' : name.slice(index + 1).toLowerCase();
}

export function join(...segments: string[]): string {
  return normalizePath(segments.filter(Boolean).join(POSIX_SEPARATOR));
}

export function relative(root: string, target: string): string {
  const normRoot = normalizePath(root);
  const normTarget = normalizePath(target);
  if (normTarget.startsWith(normRoot)) {
    return normTarget.slice(normRoot.length).replace(/^\//, '');
  }
  return normTarget;
}

export function split(path: string): string[] {
  return normalizePath(path).split(POSIX_SEPARATOR).filter(Boolean);
}
