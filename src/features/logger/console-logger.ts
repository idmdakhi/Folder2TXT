import type { Logger } from './logger.js';

export class ConsoleLogger implements Logger {
  constructor(private readonly context?: Record<string, unknown>) {}

  debug(message: string, ...meta: unknown[]): void {
    console.debug(`[DEBUG] ${message}`, ...meta, this.context);
  }
  info(message: string, ...meta: unknown[]): void {
    console.info(`[INFO] ${message}`, ...meta, this.context);
  }
  warn(message: string, ...meta: unknown[]): void {
    console.warn(`[WARN] ${message}`, ...meta, this.context);
  }
  error(message: string, ...meta: unknown[]): void {
    console.error(`[ERROR] ${message}`, ...meta, this.context);
  }
  child(meta: Record<string, unknown>): Logger {
    return new ConsoleLogger({ ...this.context, ...meta });
  }
}
