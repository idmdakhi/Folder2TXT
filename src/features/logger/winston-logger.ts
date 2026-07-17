// import winston from 'winston';
// import DailyRotateFile from 'winston-daily-rotate-file';
// import type { Logger } from './logger.js';

// export class WinstonLogger implements Logger {
//   private logger: winston.Logger;

//   constructor(options?: { level?: string; filename?: string }) {
//     const level = options?.level ?? 'info';
//     const filename = options?.filename ?? 'logs/repo2txt-%DATE%.log';

//     this.logger = winston.createLogger({
//       level,
//       format: winston.format.combine(
//         winston.format.timestamp(),
//         winston.format.json(),
//       ),
//       transports: [
//         new winston.transports.Console({
//           format: winston.format.combine(
//             winston.format.colorize(),
//             winston.format.simple(),
//           ),
//         }),
//         new DailyRotateFile({
//           filename,
//           datePattern: 'YYYY-MM-DD',
//           maxFiles: '14d',
//         }),
//       ],
//     });
//   }

//   debug(message: string, ...meta: unknown[]): void {
//     this.logger.debug(message, ...meta);
//   }
//   info(message: string, ...meta: unknown[]): void {
//     this.logger.info(message, ...meta);
//   }
//   warn(message: string, ...meta: unknown[]): void {
//     this.logger.warn(message, ...meta);
//   }
//   error(message: string, ...meta: unknown[]): void {
//     this.logger.error(message, ...meta);
//   }
//   child(meta: Record<string, unknown>): Logger {
//     const child = this.logger.child(meta);
//     return {
//       debug: (msg, ...m) => child.debug(msg, ...m),
//       info: (msg, ...m) => child.info(msg, ...m),
//       warn: (msg, ...m) => child.warn(msg, ...m),
//       error: (msg, ...m) => child.error(msg, ...m),
//       child: (m) => new WinstonLogger({ ...this.logger.level, ...m }) as any,
//     };
//   }
// }
