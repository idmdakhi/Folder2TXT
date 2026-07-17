import { parentPort } from 'node:worker_threads';
import { readFile } from 'node:fs/promises';

interface WorkerMessage {
  id: string;
  data: {
    path: string;
    encoding?: BufferEncoding;
    maxSize?: number;
  };
}

if (!parentPort) {
  throw new Error('This file must be run as a worker thread');
}

parentPort.on('message', async (message: WorkerMessage) => {
  const { id, data } = message;

  try {
    const { path, encoding = 'utf8', maxSize } = data;

    // بررسی حجم فایل
    const stat = await import('node:fs/promises').then((fs) => fs.stat(path));
    if (maxSize && stat.size > maxSize) {
      parentPort?.postMessage({
        id,
        error: `File size ${stat.size} exceeds max size ${maxSize}`,
      });
      return;
    }

    // خواندن فایل
    const content = await readFile(path, {
      encoding: encoding as BufferEncoding,
    });

    parentPort?.postMessage({
      id,
      result: {
        path,
        content,
        size: stat.size,
        modifiedAt: stat.mtime,
      },
    });
  } catch (error) {
    parentPort?.postMessage({
      id,
      error: (error as Error).message,
    });
  }
});
