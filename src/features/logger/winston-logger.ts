import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import type { Logger } from './logger.js';

export interface WinstonLoggerOptions {
  level?: string;
  filename?: string;
  console?: boolean;
}

export class WinstonLogger implements Logger {
  private logger: winston.Logger;
  private level: string;

  constructor(options: WinstonLoggerOptions = {}) {
    this.level = options.level ?? process.env.LOG_LEVEL ?? 'info';
    const filename = options.filename ?? 'logs/repo2txt-%DATE%.log';
    const consoleEnabled = options.console !== false;

    const transports: winston.transport[] = [];

    if (consoleEnabled) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              const metaStr = Object.keys(meta).length
                ? ` ${JSON.stringify(meta)}`
                : '';
              return `${timestamp} [${level}]: ${message}${metaStr}`;
            }),
          ),
        }),
      );
    }

    transports.push(
      new DailyRotateFile({
        filename,
        datePattern: 'YYYY-MM-DD',
        maxFiles: '14d',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    );

    this.logger = winston.createLogger({
      level: this.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
      ),
      transports,
    });
  }

  debug(message: string, ...meta: unknown[]): void {
    this.logger.debug(message, ...meta);
  }

  info(message: string, ...meta: unknown[]): void {
    this.logger.info(message, ...meta);
  }

  warn(message: string, ...meta: unknown[]): void {
    this.logger.warn(message, ...meta);
  }

  error(message: string, ...meta: unknown[]): void {
    this.logger.error(message, ...meta);
  }

  child(meta: Record<string, unknown>): Logger {
    const childLogger = this.logger.child(meta);
    return {
      debug: (msg, ...m) => childLogger.debug(msg, ...m),
      info: (msg, ...m) => childLogger.info(msg, ...m),
      warn: (msg, ...m) => childLogger.warn(msg, ...m),
      error: (msg, ...m) => childLogger.error(msg, ...m),
      child: (m) => new WinstonLogger({ level: this.level, ...m }),
    };
  }

  /**
   * دسترسی به نمونه اصلی Winston برای استفاده‌های پیشرفته
   */
  getInstance(): winston.Logger {
    return this.logger;
  }
}
