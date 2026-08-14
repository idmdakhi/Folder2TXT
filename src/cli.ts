#!/usr/bin/env node

/**
 * CLI برای folder2txt
 * تبدیل ساختار پوشه و محتوای فایل‌های متنی به یک فایل متنی یکپارچه
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { globby } from 'globby';
import path from 'path';
import fs from 'fs/promises';
import { processFolder } from './services/folderProcessor.js';
import { config } from './config/index.js';
import logger from './utils/logger.js';
import { FileEntry, ProcessOptions } from './shared/core.js';
import { getTemplate, TemplateType } from './services/templateManager.js';
import { generateZip } from './services/zipGenerator.js';
import { uploadToGist, validateGithubToken } from './services/githubService.js';

const program = new Command();

program
  .name('folder2txt')
  .description('تبدیل ساختار پوشه و محتوای فایل‌های متنی به یک فایل متنی یکپارچه')
  .version('2.1.0');

program
  .command('process <folderPath>')
  .description('پردازش یک پوشه و تولید فایل خروجی')
  .option('-o, --output <file>', 'مسیر فایل خروجی', 'output.txt')
  .option('-t, --types <types>', 'پسوندهای مجاز (جداشده با کاما)', '')
  .option('-c, --clean', 'پاک‌سازی کامنت‌ها و فاصله‌های اضافی', false)
  .option('-s, --separator <sep>', 'جداکننده بین فایل‌ها', '--- {filename} ---')
  .option('--common-only', 'فقط پسوندهای رایج', false)
  .option('-d, --max-depth <depth>', 'حداکثر عمق پیمایش', undefined)
  .option('-i, --ignore <patterns>', 'الگوهای نادیده‌گیری (جداشده با کاما)', '')
  .option('--gitignore', 'استفاده از .gitignore', false)
  .option('--no-tree', 'عدم نمایش ساختار درختی', false)
  .option('--no-overview', 'عدم نمایش نمای کلی پروژه', false)
  .option('-q, --quiet', 'حالت بی‌صدا (بدون لاگ)', false)
  .option('-j, --json', 'خروجی JSON', false)
  .option('-T, --template <type>', 'قالب خروجی (default|github|llm|concise|detailed|markdown|json)', 'default')
  .option('-f, --format <format>', 'فرمت خروجی (txt|zip)', 'txt')
  .action(async (folderPath: string, options: any) => {
    try {
      if (options.quiet) {
        logger.level = 'error';
      }

      const spinner = ora('در حال پردازش پوشه...').start();

      // اعتبارسنجی مسیر
      const resolvedPath = path.resolve(folderPath);
      try {
        const stats = await fs.stat(resolvedPath);
        if (!stats.isDirectory()) {
          throw new Error('مسیر وارد شده یک پوشه نیست');
        }
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          throw new Error('پوشه وجود ندارد');
        }
        throw new Error(`دسترسی به پوشه امکان‌پذیر نیست: ${err.message}`);
      }

      // پردازش گزینه‌ها
      const selectedTypes = options.types
        ? options.types.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];

      const ignorePatterns = options.ignore
        ? options.ignore.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];

      // خواندن .gitignore
      if (options.gitignore) {
        const gitignorePath = path.join(resolvedPath, '.gitignore');
        try {
          const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
          const gitignoreLines = gitignoreContent
            .split('\n')
            .map((line: string) => line.trim())
            .filter((line: string) => line && !line.startsWith('#'));
          ignorePatterns.push(...gitignoreLines);
        } catch (err) {
          logger.warn('فایل .gitignore یافت نشد یا قابل خواندن نیست');
        }
      }

      const processOptions: ProcessOptions = {
        selectedTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
        cleanMode: options.clean,
        separator: options.separator,
        commonOnly: options.commonOnly,
        maxDepth: options.maxDepth ? parseInt(options.maxDepth, 10) : undefined,
        ignorePatterns: ignorePatterns.length > 0 ? ignorePatterns : undefined,
      };

      const result = await processFolder(resolvedPath, processOptions);

      // اعمال قالب انتخاب‌شده
      const templateType = (options.template || 'default') as TemplateType;
      const templateFn = getTemplate(templateType);
      let finalContent = templateFn(result.files, resolvedPath, {
        includeTree: options.tree !== false,
        includeOverview: options.overview !== false,
        includeContent: true,
        maxFileLength: options.maxFileLength ? parseInt(options.maxFileLength, 10) : undefined,
      });

      // نوشتن خروجی بر اساس فرمت انتخاب‌شده
      const outputPath = path.resolve(options.output);
      
      if (options.format === 'zip') {
        // تولید فایل ZIP
        const zipPath = outputPath.endsWith('.zip') ? outputPath : outputPath + '.zip';
        await generateZip(
          [{ filename: path.basename(zipPath).replace('.zip', '.txt'), content: finalContent }],
          zipPath
        );
        spinner.succeed(chalk.green(`بسته ZIP با موفقیت ذخیره شد: ${zipPath}`));
      } else {
        // نوشتن فایل متنی ساده
        await fs.writeFile(outputPath, finalContent, 'utf-8');
        spinner.succeed(chalk.green(`خروجی با موفقیت ذخیره شد: ${outputPath}`));
      }

      console.log(chalk.blue('\nآمار:'));
      console.log(`  تعداد فایل‌ها: ${chalk.yellow(result.fileCount.toString())}`);
      console.log(`  حجم کل: ${chalk.yellow((result.totalSize / 1024).toFixed(2) + ' KB')}`);
      console.log(`  قالب: ${chalk.cyan(templateType)}`);
      console.log(`  فرمت: ${chalk.cyan(options.format || 'txt')}`);

      if (options.json) {
        const jsonOutput = {
          success: true,
          outputPath,
          fileCount: result.fileCount,
          totalSize: result.totalSize,
          template: templateType,
          format: options.format || 'txt',
        };
        console.log(JSON.stringify(jsonOutput, null, 2));
      }
    } catch (error: any) {
      console.error(chalk.red(`خطا: ${error.message}`));
      logger.error(error);
      process.exit(1);
    }
  });

program
  .command('info <folderPath>')
  .description('نمایش اطلاعات کلی درباره یک پوشه')
  .option('-i, --ignore <patterns>', 'الگوهای نادیده‌گیری (جداشده با کاما)', '')
  .option('--gitignore', 'استفاده از .gitignore', false)
  .option('-q, --quiet', 'حالت بی‌صدا', false)
  .action(async (folderPath: string, options: any) => {
    let spinner: any;
    try {
      if (options.quiet) {
        logger.level = 'error';
      }
      spinner = ora('در حال تحلیل پوشه...').start();

      const resolvedPath = path.resolve(folderPath);

      const ignorePatterns = options.ignore
        ? options.ignore.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];

      if (options.gitignore) {
        const gitignorePath = path.join(resolvedPath, '.gitignore');
        try {
          const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
          const gitignoreLines = gitignoreContent
            .split('\n')
            .map((line: string) => line.trim())
            .filter((line: string) => line && !line.startsWith('#'));
          ignorePatterns.push(...gitignoreLines);
        } catch (err) {
          logger.warn('فایل .gitignore یافت نشد');
        }
      }

      // استفاده از walkDir مستقیم
      const { walkDir } = await import('./services/folderWalker.js');
      const files = await walkDir(resolvedPath, resolvedPath, ignorePatterns);

      spinner.stop();

      // آمار کلی
      const totalFiles = files.length;
      const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);

      // شمارش بر اساس پسوند
      const extCount: Record<string, number> = {};
      files.forEach((f: FileEntry) => {
        const ext = f.path.split('.').pop()?.toLowerCase() || '';
        if (ext) {
          extCount[ext] = (extCount[ext] || 0) + 1;
        }
      });

      // تشخیص فناوری‌ها
      const { detectTechnologies } = await import('./shared/core.js');
      const technologies = detectTechnologies(files);

      console.log(chalk.blue('\n' + '='.repeat(50)));
      console.log(chalk.blue('اطلاعات پوشه'));
      console.log(chalk.blue('='.repeat(50)));
      console.log(`\nمسیر: ${chalk.yellow(resolvedPath)}`);
      console.log(`تعداد فایل‌ها: ${chalk.yellow(totalFiles.toString())}`);
      console.log(`حجم کل: ${chalk.yellow((totalSize / (1024 * 1024)).toFixed(2) + ' MB')}`);

      if (Object.keys(extCount).length > 0) {
        console.log('\nپسوندها:');
        const sorted = Object.entries(extCount).sort((a, b) => b[1] - a[1]);
        for (const [ext, count] of sorted.slice(0, 10)) {
          console.log(`  .${chalk.cyan(ext)}: ${chalk.white(count.toString())}`);
        }
      }

      if (technologies.length > 0) {
        console.log('\nفناوری‌های تشخیص‌داده‌شده:');
        for (const tech of technologies) {
          console.log(`  ${chalk.green('✓')} ${tech}`);
        }
      }

      console.log();
    } catch (error: any) {
      if (spinner) spinner.fail();
      console.error(chalk.red(`خطا: ${error.message}`));
      logger.error(error);
      process.exit(1);
    }
  });

program
  .command('interactive')
  .description('حالت تعاملی با پرسش و پاسخ')
  .action(async () => {
    try {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'folderPath',
          message: 'مسیر پوشه را وارد کنید:',
          validate: async (input: string) => {
            try {
              const stats = await fs.stat(path.resolve(input));
              return stats.isDirectory() ? true : 'این مسیر یک پوشه نیست';
            } catch {
              return 'پوشه وجود ندارد';
            }
          },
        },
        {
          type: 'input',
          name: 'output',
          message: 'نام فایل خروجی:',
          default: 'output.txt',
        },
        {
          type: 'input',
          name: 'types',
          message: 'پسوندهای مجاز (اختیاری، جداشده با کاما):',
          default: '',
        },
        {
          type: 'confirm',
          name: 'cleanMode',
          message: 'آیا می‌خواهید کامنت‌ها و فاصله‌های اضافی پاک شوند؟',
          default: false,
        },
        {
          type: 'confirm',
          name: 'commonOnly',
          message: 'آیا فقط پسوندهای رایج پردازش شوند؟',
          default: false,
        },
        {
          type: 'input',
          name: 'maxDepth',
          message: 'حداکثر عمق پیمایش (اختیاری):',
          default: '',
        },
        {
          type: 'confirm',
          name: 'useGitignore',
          message: 'آیا از .gitignore استفاده شود؟',
          default: true,
        },
      ]);

      const selectedTypes = answers.types
        ? answers.types.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];

      const ignorePatterns: string[] = [];
      if (answers.useGitignore) {
        const gitignorePath = path.join(path.resolve(answers.folderPath), '.gitignore');
        try {
          const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
          const gitignoreLines = gitignoreContent
            .split('\n')
            .map((line: string) => line.trim())
            .filter((line: string) => line && !line.startsWith('#'));
          ignorePatterns.push(...gitignoreLines);
        } catch (err) {
          logger.warn('فایل .gitignore یافت نشد');
        }
      }

      const processOptions: ProcessOptions = {
        selectedTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
        cleanMode: answers.cleanMode,
        commonOnly: answers.commonOnly,
        maxDepth: answers.maxDepth ? parseInt(answers.maxDepth, 10) : undefined,
        ignorePatterns: ignorePatterns.length > 0 ? ignorePatterns : undefined,
      };

      const spinner = ora('در حال پردازش...').start();
      const result = await processFolder(path.resolve(answers.folderPath), processOptions);
      spinner.stop();

      await fs.writeFile(path.resolve(answers.output), result.content, 'utf-8');

      console.log(chalk.green(`\n✓ خروجی با موفقیت ذخیره شد: ${answers.output}`));
      console.log(chalk.blue(`  تعداد فایل‌ها: ${result.fileCount}`));
      console.log(chalk.blue(`  حجم کل: ${(result.totalSize / 1024).toFixed(2)} KB`));
    } catch (error: any) {
      console.error(chalk.red(`خطا: ${error.message}`));
      logger.error(error);
      process.exit(1);
    }
  });

program
  .command('upload <folderPath>')
  .description('آپلود پروژه به GitHub Gist')
  .option('-t, --token <token>', 'توکن GitHub', process.env.GITHUB_TOKEN || '')
  .option('-d, --description <desc>', 'توضیحات Gist', 'Project export via folder2txt')
  .option('-p, --public', 'عمومی کردن Gist', false)
  .option('-T, --template <type>', 'قالب خروجی', 'default')
  .option('--filename <name>', 'نام فایل در Gist', 'project-export.txt')
  .action(async (folderPath: string, options: any) => {
    try {
      const spinner = ora('در حال پردازش و آماده‌سازی برای آپلود...').start();

      // اعتبارسنجی توکن
      if (!options.token) {
        spinner.fail();
        console.error(chalk.red('خطا: توکن GitHub الزامی است. از گزینه --token استفاده کنید یا متغیر محیطی GITHUB_TOKEN را تنظیم کنید.'));
        console.log(chalk.yellow('\nراهنما:'));
        console.log('  ۱. به https://github.com/settings/tokens بروید');
        console.log('  ۲. یک توکن جدید با دسترسی "gist" ایجاد کنید');
        console.log('  ۳. از دستور زیر استفاده کنید:');
        console.log(chalk.cyan('     folder2txt upload ./my-project --token ghp_...'));
        process.exit(1);
      }

      // بررسی اعتبار توکن
      const validation = await validateGithubToken(options.token);
      if (!validation.valid) {
        spinner.fail();
        console.error(chalk.red('توکن GitHub نامعتبر است یا منقضی شده است.'));
        process.exit(1);
      }

      spinner.text = `پردازش پوشه با قالب ${options.template}...`;
      
      const resolvedPath = path.resolve(folderPath);
      const { walkDir } = await import('./services/folderWalker.js');
      const files = await walkDir(resolvedPath, resolvedPath, []);
      
      const templateType = (options.template || 'default') as TemplateType;
      const templateFn = getTemplate(templateType);
      const content = templateFn(files, resolvedPath, { includeContent: true });

      spinner.text = 'در حال آپلود به GitHub Gist...';
      
      const result = await uploadToGist(content, {
        token: options.token,
        description: options.description,
        public: options.public || false,
        filename: options.filename || 'project-export.txt'
      });

      if (result.success && result.gistUrl) {
        spinner.succeed(chalk.green('با موفقیت به GitHub Gist آپلود شد!'));
        console.log(chalk.blue('\\nاطلاعات Gist:'));
        console.log(`  لینک: ${chalk.cyan(result.gistUrl)}`);
        console.log(`  شناسه: ${chalk.yellow(result.gistId || 'N/A')}`);
        console.log(`  وضعیت: ${options.public ? chalk.green('عمومی') : chalk.yellow('خصوصی')}`);
        console.log(`  نام فایل: ${chalk.white(options.filename || 'project-export.txt')}`);
      } else {
        spinner.fail();
        console.error(chalk.red(`خطا در آپلود: ${result.error}`));
        process.exit(1);
      }
    } catch (error: any) {
      console.error(chalk.red(`خطا: ${error.message}`));
      logger.error(error);
      process.exit(1);
    }
  });

program.parse();
