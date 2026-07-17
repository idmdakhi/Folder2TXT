import { Worker } from 'node:worker_threads';
import { EventEmitter } from 'node:events';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface PoolOptions {
  concurrency?: number;
  taskTimeout?: number;
}

export interface Task<T = unknown, R = unknown> {
  id: string;
  data: T;
  resolve: (value: R) => void;
  reject: (error: Error) => void;
}

export class WorkerPool<T = unknown, R = unknown> extends EventEmitter {
  private workers: Worker[] = [];
  private queue: Task<T, R>[] = [];
  // private queue: PQueue;
  private activeTasks = 0;
  private readonly concurrency: number;
  private readonly taskTimeout: number;
  private isShuttingDown = false;

  constructor(options: PoolOptions = {}) {
    super();
    this.concurrency = options.concurrency ?? 4;
    this.taskTimeout = options.taskTimeout ?? 30000;
    this.initializeWorkers();
  }

  private initializeWorkers(): void {
    // ساخت مسیر مطلق worker.js
    // در حالت توسعه (tsx)، worker.ts به worker.js تبدیل می‌شود
    // در حالت تولید (dist)، worker.js در همان پوشه قرار دارد
    const workerPath = resolve(__dirname, 'worker.js');

    for (let i = 0; i < this.concurrency; i++) {
      const worker = new Worker(workerPath, {
        workerData: { workerId: i },
      });

      worker.on('message', (result) => {
        this.activeTasks--;
        this.processQueue();
        this.emit('taskComplete', result);
      });

      worker.on('error', (error) => {
        this.emit('workerError', error);
        this.activeTasks--;
        this.processQueue();
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          this.emit('workerExit', code);
        }
        this.activeTasks--;
        this.processQueue();
      });

      this.workers.push(worker);
    }
  }

  public async execute(data: T): Promise<R> {
    if (this.isShuttingDown) {
      throw new Error('Pool is shutting down');
    }

    return new Promise((resolve, reject) => {
      const task: Task<T, R> = {
        id: crypto.randomUUID(),
        data,
        resolve,
        reject,
      };

      this.queue.push(task);
      this.processQueue();
    });
  }

  private processQueue(): void {
    if (this.queue.length === 0 || this.activeTasks >= this.concurrency) {
      return;
    }

    const task = this.queue.shift();
    if (!task) return;

    const worker = this.getAvailableWorker();
    if (!worker) {
      this.queue.unshift(task);
      return;
    }

    this.activeTasks++;
    worker.postMessage({ id: task.id, data: task.data });

    // تنظیم تایم‌اوت
    const timeout = setTimeout(() => {
      task.reject(
        new Error(`Task ${task.id} timed out after ${this.taskTimeout}ms`),
      );
      this.activeTasks--;
      this.processQueue();
    }, this.taskTimeout);

    // پاک‌سازی timeout پس از اتمام
    worker.once('message', () => {
      clearTimeout(timeout);
    });
  }

  private getAvailableWorker(): Worker | null {
    // ساده: استفاده round-robin
    for (const worker of this.workers) {
      // در این پیاده‌سازی ساده، فرض می‌کنیم worker آزاد است
      // برای پیاده‌سازی دقیق‌تر باید وضعیت worker را ردیابی کرد
      return worker;
    }
    return null;
  }

  public async shutdown(): Promise<void> {
    this.isShuttingDown = true;
    await Promise.all(this.workers.map((worker) => worker.terminate()));
    this.workers = [];
    this.queue = [];
    this.emit('shutdown');
  }

  public getQueueSize(): number {
    return this.queue.length;
  }

  public getActiveTasks(): number {
    return this.activeTasks;
  }
}
