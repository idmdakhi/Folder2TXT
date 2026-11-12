import app from "./app";
import { config } from "./config";
import logger from "./utils/logger";
import { exec } from "child_process";

const url = `http://localhost:${config.port}`;
const isPackaged = Boolean((process as any).pkg);

const server = app.listen(config.port, () => {
  logger.info(`Server running on ${url} in ${config.nodeEnv} mode`);

  // وقتی برنامه به‌صورت فایل اجرایی (exe) اجرا می‌شود، مرورگر را خودکار باز کن.
  if (isPackaged && process.env.OPEN_BROWSER !== "false") {
    const command =
      process.platform === "win32"
        ? `start "" "${url}"`
        : process.platform === "darwin"
          ? `open "${url}"`
          : `xdg-open "${url}"`;

    exec(command, (err) => {
      if (err) {
        logger.warn(`Could not open browser automatically: ${err.message}`);
      }
    });
  }
});

function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully`);
  server.close(() => {
    logger.info("Process terminated");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
