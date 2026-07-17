#!/usr/bin/env node
import express from 'express';
import path from 'node:path';
import fs from 'fs';
import { fileURLToPath } from 'node:url';
import { LoadConfigUseCase } from '../../src/features/config/index.js';
import { RunRepo2TxtUseCase } from '../../src/app/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// ===== تنظیمات View Engine =====
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../../views'));

// ===== Middleware =====
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.resolve(__dirname, '../../')));

// ===== صفحه اصلی =====
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../../views/client.html'));
});

// ===== پردازش روی سرور =====
app.post('/process', async (req, res) => {
  const {
    folderPath,
    outputName = 'merged_files.txt',
    format = 'txt',
    renderTree = true,
    enableStats = true,
    removeComments = false,
    removeBlankLines = false,
  } = req.body;
  let safePath;
  try {
    safePath = validatePath(folderPath);
    // ادامه پردازش با safePath
  } catch (error) {
    return res.status(400).send(console.error('', (error as Error).message));
  }
  if (!folderPath || folderPath.trim().length === 0) {
    return res.status(400).send('مسیر پوشه الزامی است.');
  }

  try {
    const config = new LoadConfigUseCase().execute({
      cli: {
        root: folderPath,
        output: outputName || 'merged_files.txt',
        format: format,
        renderTree: renderTree,
        includeHidden: false,
        followSymlinks: false,
        removeComments: removeComments,
        removeBlankLines: removeBlankLines,
        // ویژگی‌های جدید
        enableStats: enableStats,
        gitignore: true,
        detectBinary: true,
        concurrency: 1,
      },
    });

    const runner = new RunRepo2TxtUseCase(config);
    await runner.execute();

    // نمایش صفحه نتایج (با آمار)
    // برای سادگی، فایل را دانلود می‌کنیم
    const outputFile = config.output;
    return res.download(outputFile, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).send('خطا در دانلود فایل');
        }
      }
    });
  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).send(`خطا در پردازش: ${(error as Error).message}`);
  }
});

// ===== نمایش نتایج (با EJS) =====
app.get('/result', (req, res) => {
  // این مسیر برای نمایش نتایج قبلی یا اطلاعات نمایشی استفاده می‌شود
  res.render('result', {
    rootPath: req.query.path || 'نامشخص',
    outputFile: req.query.file || 'merged_files.txt',
    stats: {
      totalFiles: 42,
      totalSizeFormatted: '2.3 MB',
      totalLines: 1250,
      durationMs: 2340,
      languages: [
        { name: 'TypeScript', fileCount: 18, language: { color: '#3178c6' } },
        { name: 'JavaScript', fileCount: 12, language: { color: '#f7df1e' } },
        { name: 'HTML', fileCount: 6, language: { color: '#e34c26' } },
        { name: 'CSS', fileCount: 4, language: { color: '#563d7c' } },
        { name: 'JSON', fileCount: 2, language: { color: '#f1c40f' } },
      ],
      largestFiles: [
        {
          path: 'src/features/scanner/repository-scanner.ts',
          sizeFormatted: '45.2 KB',
        },
        { path: 'src/app/container.ts', sizeFormatted: '12.8 KB' },
        { path: 'package-lock.json', sizeFormatted: '136.3 KB' },
      ],
      newestFiles: [
        { path: 'apps/server/index.ts', modifiedAt: new Date().toISOString() },
        {
          path: 'client.html',
          modifiedAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          path: 'README.md',
          modifiedAt: new Date(Date.now() - 7200000).toISOString(),
        },
      ],
    },
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 repo2txt Server running on http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  console.log('Shutting down server...');
  process.exit(0);
});

function validatePath(userPath: string): string {
  const baseDir = process.env.BASE_DIR || process.cwd();
  const resolved = path.resolve(baseDir, userPath);

  // جلوگیری از خروج از دایرکتوری پایه
  if (!resolved.startsWith(baseDir)) {
    throw new Error('دسترسی به مسیر مورد نظر مجاز نیست');
  }

  // بررسی وجود دایرکتوری
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
    throw new Error('مسیر وارد شده معتبر نیست یا یک پوشه نیست');
  }

  return resolved;
}
