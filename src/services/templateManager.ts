// src/services/templateManager.ts
// سیستم قالب‌بندی خروجی برای کاربردهای مختلف

import { FileEntry } from '../shared/core';

export type TemplateType = 
  | 'default'      // قالب پیش‌فرض
  | 'github'       // بهینه برای GitHub
  | 'llm'          // بهینه برای مدل‌های زبانی
  | 'concise'      // خلاصه و فشرده
  | 'detailed'     // با جزئیات کامل
  | 'markdown'     // فرمت Markdown غنی
  | 'json'         // فرمت JSON ساختاریافته
  ;

export interface TemplateOptions {
  includeTree?: boolean;
  includeOverview?: boolean;
  includeContent?: boolean;
  includeLineNumbers?: boolean;
  maxFileLength?: number;
  truncateLongFiles?: boolean;
}

export interface TemplateResult {
  content: string;
  format: string;
  metadata: {
    template: TemplateType;
    fileCount: number;
    totalSize: number;
    generatedAt: string;
  };
}

/**
 * انتخاب قالب بر اساس نوع درخواست
 */
export function getTemplate(type: TemplateType): (files: FileEntry[], root: string, options?: TemplateOptions) => string {
  switch (type) {
    case 'github':
      return formatGithubTemplate;
    case 'llm':
      return formatLLMTemplate;
    case 'concise':
      return formatConciseTemplate;
    case 'detailed':
      return formatDetailedTemplate;
    case 'markdown':
      return formatMarkdownTemplate;
    case 'json':
      return formatJsonTemplate;
    default:
      return formatDefaultTemplate;
  }
}

/**
 * قالب پیش‌فرض
 */
function formatDefaultTemplate(files: FileEntry[], root: string, options?: TemplateOptions): string {
  const parts: string[] = [];
  
  if (options?.includeOverview !== false) {
    parts.push(generateSimpleOverview(files));
  }
  
  if (options?.includeTree !== false) {
    parts.push('\n## FILE STRUCTURE\n');
    parts.push(generateSimpleTree(files, root));
  }
  
  if (options?.includeContent !== false) {
    parts.push('\n## FILES\n');
    for (const file of files) {
      parts.push(`\n--- ${file.path} ---\n`);
      if (file.error) {
        parts.push(`[ERROR: ${file.error}]\n`);
      } else if (file.isBinary) {
        parts.push(`[BINARY FILE - ${file.size} bytes]\n`);
      } else if (file.content) {
        let content = file.content;
        if (options?.maxFileLength && content.length > options.maxFileLength) {
          content = content.slice(0, options.maxFileLength) + '\n... [truncated]';
        }
        parts.push(content);
      }
    }
  }
  
  return parts.join('\n');
}

/**
 * قالب بهینه برای GitHub (با فرمت‌بندی Markdown)
 */
function formatGithubTemplate(files: FileEntry[], root: string, options?: TemplateOptions): string {
  const parts: string[] = [];
  
  parts.push('# 📁 Project Export\n');
  parts.push(`**Generated:** ${new Date().toISOString()}\n`);
  parts.push(`**Root:** ${root}\n`);
  parts.push(`**Total Files:** ${files.length}\n\n`);
  
  // جدول محتوا
  parts.push('## 📑 Table of Contents\n');
  parts.push('| File | Type | Size |\n');
  parts.push('|------|------|------|\n');
  
  for (const file of files) {
    const ext = file.path.split('.').pop() || '';
    const size = file.size ? `${file.size} B` : 'N/A';
    const anchor = file.path.replace(/[\s.]/g, '-').toLowerCase();
    parts.push(`| [${file.path}](#${anchor}) | ${ext} | ${size} |\n`);
  }
  
  parts.push('\n## 🌳 File Structure\n\n```text\n');
  parts.push(generateSimpleTree(files, root));
  parts.push('\n```\n');
  
  parts.push('\n## 📄 File Contents\n\n');
  
  for (const file of files) {
    const ext = file.path.split('.').pop() || '';
    parts.push(`### 📎 ${file.path}\n\n`);
    
    if (file.error) {
      parts.push(`⚠️ Error: ${file.error}\n\n`);
    } else if (file.isBinary) {
      parts.push(`📦 Binary file (${file.size} bytes)\n\n`);
    } else if (file.content) {
      parts.push('```' + ext + '\n');
      
      let content = file.content;
      if (options?.maxFileLength && content.length > options.maxFileLength) {
        content = content.slice(0, options.maxFileLength) + '\n\n... [truncated]';
      }
      
      if (options?.includeLineNumbers) {
        const lines = content.split('\n');
        const padded = lines.map((line, i) => `${String(i + 1).padStart(4)} | ${line}`);
        content = padded.join('\n');
      }
      
      parts.push(content);
      parts.push('\n```\n\n');
    }
  }
  
  return parts.join('');
}

/**
 * قالب بهینه برای LLM (حداقل توکن، حداکثر اطلاعات)
 */
function formatLLMTemplate(files: FileEntry[], root: string, options?: TemplateOptions): string {
  const parts: string[] = [];
  
  // هدر مختصر
  parts.push(`PROJECT: ${root.split('/').pop()}\n`);
  parts.push(`FILES: ${files.length}\n`);
  parts.push(`DATE: ${new Date().toISOString().split('T')[0]}\n\n`);
  
  // ساختار درختی فشرده
  parts.push('STRUCTURE:\n');
  parts.push(generateCompactTree(files, root));
  parts.push('\n\n');
  
  // محتوای فایل‌ها بدون حاشیه
  for (const file of files) {
    if (!file.content || file.isBinary || file.error) continue;
    
    parts.push(`FILE: ${file.path}\n`);
    
    let content = file.content;
    
    // حذف کامنت‌ها برای کاهش توکن
    content = removeComments(content, file.path.split('.').pop() || '');
    
    // حذف خطوط خالی اضافی
    content = content.replace(/\n{3,}/g, '\n\n');
    
    if (options?.maxFileLength && content.length > options.maxFileLength) {
      content = content.slice(0, options.maxFileLength);
    }
    
    parts.push(content);
    parts.push('\n\n');
  }
  
  return parts.join('');
}

/**
 * قالب خلاصه و فشرده
 */
function formatConciseTemplate(files: FileEntry[], root: string, options?: TemplateOptions): string {
  const parts: string[] = [];
  
  parts.push(`Project: ${root.split('/').pop()} | Files: ${files.length}\n\n`);
  
  for (const file of files) {
    if (!file.content || file.isBinary || file.error) continue;
    
    parts.push(`[${file.path}]\n`);
    
    let content = file.content;
    
    // فقط خطوط کد مهم
    const lines = content.split('\n')
      .filter(line => line.trim() !== '')
      .filter(line => !line.trim().startsWith('//') && !line.trim().startsWith('#'))
      .slice(0, 50); // حداکثر ۵۰ خط
    
    parts.push(lines.join('\n'));
    parts.push('\n\n');
  }
  
  return parts.join('');
}

/**
 * قالب با جزئیات کامل
 */
function formatDetailedTemplate(files: FileEntry[], root: string, options?: TemplateOptions): string {
  const parts: string[] = [];
  
  parts.push('='.repeat(60) + '\n');
  parts.push('DETAILED PROJECT EXPORT\n');
  parts.push('='.repeat(60) + '\n\n');
  
  parts.push('METADATA:\n');
  parts.push(`  Root Directory: ${root}\n`);
  parts.push(`  Total Files: ${files.length}\n`);
  parts.push(`  Generated At: ${new Date().toISOString()}\n`);
  parts.push(`  Total Size: ${files.reduce((sum, f) => sum + (f.size || 0), 0)} bytes\n\n`);
  
  // آمار انواع فایل
  const typeStats: Record<string, number> = {};
  files.forEach(f => {
    const ext = f.path.split('.').pop() || 'unknown';
    typeStats[ext] = (typeStats[ext] || 0) + 1;
  });
  
  parts.push('FILE TYPE DISTRIBUTION:\n');
  for (const [ext, count] of Object.entries(typeStats)) {
    parts.push(`  .${ext}: ${count} file(s)\n`);
  }
  parts.push('\n');
  
  parts.push('DIRECTORY STRUCTURE:\n');
  parts.push(generateSimpleTree(files, root));
  parts.push('\n\n');
  
  parts.push('FILE CONTENTS:\n');
  parts.push('-'.repeat(60) + '\n\n');
  
  for (const file of files) {
    parts.push(`File: ${file.path}\n`);
    parts.push(`Size: ${file.size || 0} bytes\n`);
    parts.push(`Lines: ${file.content ? file.content.split('\n').length : 0}\n`);
    parts.push('-'.repeat(40) + '\n');
    
    if (file.error) {
      parts.push(`ERROR: ${file.error}\n\n`);
    } else if (file.isBinary) {
      parts.push('[BINARY FILE]\n\n');
    } else if (file.content) {
      if (options?.includeLineNumbers) {
        const lines = file.content.split('\n');
        const padded = lines.map((line, i) => `${String(i + 1).padStart(4)} | ${line}`);
        parts.push(padded.join('\n'));
      } else {
        parts.push(file.content);
      }
      parts.push('\n\n');
    }
  }
  
  return parts.join('');
}

/**
 * قالب Markdown غنی
 */
function formatMarkdownTemplate(files: FileEntry[], root: string, options?: TemplateOptions): string {
  return formatGithubTemplate(files, root, options);
}

/**
 * قالب JSON ساختاریافته
 */
function formatJsonTemplate(files: FileEntry[], root: string, options?: TemplateOptions): string {
  const output = {
    metadata: {
      root,
      generatedAt: new Date().toISOString(),
      totalFiles: files.length,
      totalSize: files.reduce((sum, f) => sum + (f.size || 0), 0),
    },
    structure: generateTreeArray(files, root),
    files: files.map(f => ({
      path: f.path,
      size: f.size,
      isBinary: f.isBinary,
      error: f.error,
      content: options?.includeContent === false ? undefined : f.content,
    })),
  };
  
  return JSON.stringify(output, null, 2);
}

// Helper functions

function generateSimpleOverview(files: FileEntry[]): string {
  const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);
  const typeCount: Record<string, number> = {};
  
  files.forEach(f => {
    const ext = f.path.split('.').pop() || '';
    typeCount[ext] = (typeCount[ext] || 0) + 1;
  });
  
  let overview = 'PROJECT OVERVIEW\n';
  overview += `Total Files: ${files.length}\n`;
  overview += `Total Size: ${(totalSize / 1024).toFixed(2)} KB\n\n`;
  overview += 'File Types:\n';
  
  for (const [ext, count] of Object.entries(typeCount)) {
    overview += `  .${ext}: ${count}\n`;
  }
  
  return overview;
}

function generateSimpleTree(files: FileEntry[], root: string): string {
  const paths = new Set<string>();
  
  for (const f of files) {
    const parts = f.path.split('/');
    let current = '';
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        paths.add(current + part);
      } else {
        current += part + '/';
        paths.add(current.slice(0, -1));
      }
    }
  }
  
  const sorted = Array.from(paths).sort();
  const prefix = root.split('/').pop() || root;
  const lines = [prefix + '/'];
  
  for (const p of sorted) {
    const depth = p.split('/').length;
    const indent = '  '.repeat(depth);
    const name = p.includes('/') ? p.split('/').pop() : p;
    const isDir = files.some(f => f.path.startsWith(p + '/'));
    lines.push(indent + (isDir ? name + '/' : name));
  }
  
  return lines.join('\n');
}

function generateCompactTree(files: FileEntry[], root: string): string {
  const dirs: Record<string, string[]> = {};
  
  for (const f of files) {
    const parts = f.path.split('/');
    const dir = parts.slice(0, -1).join('/') || '.';
    if (!dirs[dir]) dirs[dir] = [];
    dirs[dir].push(parts[parts.length - 1]);
  }
  
  const lines: string[] = [];
  for (const [dir, files_] of Object.entries(dirs).sort()) {
    const indent = dir === '.' ? '' : '  '.repeat(dir.split('/').length);
    const dirName = dir === '.' ? root.split('/').pop() : dir.split('/').pop();
    if (dirName) {
      lines.push(`${indent}${dirName}/`);
      for (const f of files_.sort()) {
        lines.push(`${indent}  ${f}`);
      }
    }
  }
  
  return lines.join('\n');
}

function generateTreeArray(files: FileEntry[], root: string): any {
  const tree: any = {};
  
  for (const f of files) {
    const parts = f.path.split('/');
    let current = tree;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        current[part] = null;
      } else {
        if (!current[part]) current[part] = {};
        current = current[part];
      }
    }
  }
  
  return tree;
}

function removeComments(content: string, ext: string): string {
  const lines = content.split('\n');
  
  return lines.filter(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('--')) {
      return false;
    }
    if (trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('*/')) {
      return false;
    }
    return true;
  }).join('\n');
}
