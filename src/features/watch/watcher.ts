import { watch } from 'node:fs';
import { EventEmitter } from 'node:events';
import { join } from 'node:path';

export interface WatcherOptions {
  root: string;
  debounceDelay?: number;
  ignorePatterns?: string[];
}

export interface FileChangeEvent {
  type: 'add' | 'change' | 'unlink';
  path: string;
  relativePath: string;
}

export class Watcher extends EventEmitter {
  private watcher?: ReturnType<typeof watch>;
  private options: Required<WatcherOptions>;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(options: WatcherOptions) {
    super();
    this.options = {
      debounceDelay: 300,
      ignorePatterns: ['node_modules/**', '.git/**', 'dist/**'],
      ...options,
    };
  }

  public start(): void {
    const { root } = this.options;

    this.watcher = watch(root, { recursive: true }, (eventType, filename) => {
      if (!filename) return;

      const fullPath = join(root, filename);

      // بررسی نادیده‌گیری
      if (this.shouldIgnore(fullPath)) return;

      // Debounce
      const key = fullPath;
      const existing = this.debounceTimers.get(key);
      if (existing) {
        clearTimeout(existing);
      }

      const timer = setTimeout(() => {
        this.debounceTimers.delete(key);

        const event: FileChangeEvent = {
          type: eventType as 'add' | 'change' | 'unlink',
          path: fullPath,
          relativePath: filename,
        };

        this.emit('change', event);
        this.emit(eventType, event);
      }, this.options.debounceDelay);

      this.debounceTimers.set(key, timer);
    });

    this.watcher.on('error', (error) => {
      this.emit('error', error);
    });
  }

  public stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = undefined;
    }

    for (const [, timer] of this.debounceTimers) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }

  private shouldIgnore(path: string): boolean {
    const normalized = path.replace(/\\/g, '/');
    for (const pattern of this.options.ignorePatterns) {
      // تبدیل الگوی ساده به regex
      const regex = new RegExp(
        pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'),
      );
      if (regex.test(normalized)) {
        return true;
      }
    }
    return false;
  }
}
