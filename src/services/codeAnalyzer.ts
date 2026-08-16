// src/services/codeAnalyzer.ts
// تحلیل کد و استخراج آمار دقیق از پروژه

import { FileEntry } from '../shared/core';

export interface CodeStats {
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  functions: number;
  classes: number;
  imports: number;
  tokens?: number;
}

export interface FileAnalysis {
  path: string;
  extension: string;
  lines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  functions: number;
  classes: number;
  imports: number;
  complexity?: number;
}

export interface ProjectAnalysis {
  totalFiles: number;
  totalLines: number;
  totalCodeLines: number;
  totalCommentLines: number;
  totalBlankLines: number;
  totalFunctions: number;
  totalClasses: number;
  totalImports: number;
  averageFileSize: number;
  largestFile: {
    path: string;
    lines: number;
  } | null;
  filesByType: Record<string, FileAnalysis[]>;
  complexityScore?: number;
}

/**
 * تحلیل یک فایل و استخراج آمار آن
 */
export function analyzeFile(file: FileEntry): FileAnalysis | null {
  if (!file.content || file.isBinary) {
    return null;
  }

  const ext = file.path.split('.').pop()?.toLowerCase() || '';
  const lines = file.content.split('\n');
  
  let codeLines = 0;
  let commentLines = 0;
  let blankLines = 0;
  let functions = 0;
  let classes = 0;
  let imports = 0;

  // الگوهای تشخیص بر اساس زبان
  const patterns = getPatternsForExtension(ext);

  for (const line of lines) {
    const trimmed = line.trim();
    
    // خط خالی
    if (trimmed === '') {
      blankLines++;
      continue;
    }

    // خط کامنت
    if (patterns.commentTest.test(trimmed)) {
      commentLines++;
      continue;
    }

    // خط کد
    codeLines++;

    // شمارش توابع
    if (patterns.functionTest.test(trimmed)) {
      functions++;
    }

    // شمارش کلاس‌ها
    if (patterns.classTest.test(trimmed)) {
      classes++;
    }

    // شمارش ایمپورت‌ها
    if (patterns.importTest.test(trimmed)) {
      imports++;
    }
  }

  return {
    path: file.path,
    extension: ext,
    lines: lines.length,
    codeLines,
    commentLines,
    blankLines,
    functions,
    classes,
    imports,
    complexity: calculateComplexity(lines, ext),
  };
}

/**
 * دریافت الگوهای تشخیص بر اساس پسوند فایل
 */
function getPatternsForExtension(ext: string) {
  const commonFunc = /^\s*(function|def|fn|func|fun)\s+\w+/;
  const commonClass = /^\s*(class|interface|struct|enum)\s+\w+/;
  const commonImport = /^\s*(import|from|require|use|include)/;
  const singleLineComment = /^\s*(\/\/|#|--|<!--)/;
  const multiLineComment = /^\s*(\/\*|\*\s)/;

  switch (ext) {
    case 'js':
    case 'ts':
    case 'jsx':
    case 'tsx':
      return {
        commentTest: /(^\s*\/\/|^\s*\/\*|^\s*\*)/,
        functionTest: /^\s*(async\s+)?(function|const|let|var)\s+\w+\s*=\s*(async\s+)?(\([^)]*\)|[\w]+)\s*=>|^\s*(async\s+)?function\s+\w+/,
        classTest: /^\s*(class|interface|type)\s+\w+/,
        importTest: /^\s*(import|export|require\()/,
      };
    case 'py':
      return {
        commentTest: /^\s*#/,
        functionTest: /^\s*(async\s+)?def\s+\w+/,
        classTest: /^\s*class\s+\w+/,
        importTest: /^\s*(import|from)/,
      };
    case 'java':
    case 'c':
    case 'cpp':
    case 'cs':
    case 'go':
    case 'rs':
      return {
        commentTest: /(^\s*\/\/|^\s*\/\*|^\s*\*)/,
        functionTest: /^\s*(public|private|protected|static|\w+)*\s*\w+\s+\w+\s*\(/,
        classTest: /^\s*(public|private|protected)?\s*(class|interface|struct|enum)\s+\w+/,
        importTest: /^\s*(import|package|using|mod)\s+/,
      };
    case 'php':
      return {
        commentTest: /(^\s*\/\/|^\s*#|^\s*\/\*|^\s*\*)/,
        functionTest: /^\s*(function|public\s+function|private\s+function|protected\s+function)\s+\w+/,
        classTest: /^\s*(class|interface|trait|abstract\s+class)\s+\w+/,
        importTest: /^\s*(use|require|include)/,
      };
    case 'rb':
      return {
        commentTest: /^\s*#/,
        functionTest: /^\s*def\s+\w+/,
        classTest: /^\s*(class|module)\s+\w+/,
        importTest: /^\s*(require|include)/,
      };
    case 'sh':
    case 'bash':
      return {
        commentTest: /^\s*#/,
        functionTest: /^\s*\w+\s*\(\s*\)/,
        classTest: /^$/,
        importTest: /^\s*(source|\. )/,
      };
    case 'sql':
      return {
        commentTest: /^\s*(--|\/\*)/,
        functionTest: /^\s*(CREATE|ALTER)\s+(FUNCTION|PROCEDURE)/i,
        classTest: /^$/,
        importTest: /^\s*(USE|INCLUDE)/i,
      };
    default:
      return {
        commentTest: singleLineComment,
        functionTest: commonFunc,
        classTest: commonClass,
        importTest: commonImport,
      };
  }
}

/**
 * محاسبه پیچیدگی تقریبی کد
 */
function calculateComplexity(lines: string[], ext: string): number {
  let complexity = 0;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // ساختارهای کنترلی
    if (/\b(if|else|elif|elseif|case|switch)\b/.test(trimmed)) {
      complexity++;
    }
    if (/\b(for|while|foreach|loop|do)\b/.test(trimmed)) {
      complexity++;
    }
    if (/\b(catch|except|rescue)\b/.test(trimmed)) {
      complexity++;
    }
    if (/\b(and|or|&&|\|\|)\b/.test(trimmed)) {
      complexity++;
    }
  }
  
  return complexity;
}

/**
 * تحلیل کل پروژه
 */
export function analyzeProject(files: FileEntry[]): ProjectAnalysis {
  const analyses: FileAnalysis[] = [];
  const filesByType: Record<string, FileAnalysis[]> = {};
  
  let totalLines = 0;
  let totalCodeLines = 0;
  let totalCommentLines = 0;
  let totalBlankLines = 0;
  let totalFunctions = 0;
  let totalClasses = 0;
  let totalImports = 0;
  
  let largestFile: { path: string; lines: number } | null = null;

  for (const file of files) {
    const analysis = analyzeFile(file);
    if (!analysis) continue;
    
    analyses.push(analysis);
    
    // گروه‌بندی بر اساس نوع فایل
    if (!filesByType[analysis.extension]) {
      filesByType[analysis.extension] = [];
    }
    filesByType[analysis.extension].push(analysis);
    
    // جمع‌آوری آمار کلی
    totalLines += analysis.lines;
    totalCodeLines += analysis.codeLines;
    totalCommentLines += analysis.commentLines;
    totalBlankLines += analysis.blankLines;
    totalFunctions += analysis.functions;
    totalClasses += analysis.classes;
    totalImports += analysis.imports;
    
    // پیدا کردن بزرگترین فایل
    if (!largestFile || analysis.lines > largestFile.lines) {
      largestFile = { path: analysis.path, lines: analysis.lines };
    }
  }
  
  const totalFiles = analyses.length;
  const averageFileSize = totalFiles > 0 ? Math.round(totalLines / totalFiles) : 0;
  
  // محاسبه امتیاز پیچیدگی پروژه
  const totalComplexity = analyses.reduce((sum, a) => sum + (a.complexity || 0), 0);
  const complexityScore = totalFiles > 0 
    ? Math.round((totalComplexity / totalLines) * 100) / 100 
    : 0;

  return {
    totalFiles,
    totalLines,
    totalCodeLines,
    totalCommentLines,
    totalBlankLines,
    totalFunctions,
    totalClasses,
    totalImports,
    averageFileSize,
    largestFile,
    filesByType,
    complexityScore,
  };
}

/**
 * تولید گزارش تحلیلی به صورت متن
 */
export function generateAnalysisReport(analysis: ProjectAnalysis): string {
  const report: string[] = [];
  
  report.push('='.repeat(60));
  report.push('CODE ANALYSIS REPORT');
  report.push('='.repeat(60));
  report.push('');
  
  report.push('📊 PROJECT STATISTICS');
  report.push('-'.repeat(40));
  report.push(`Total Files:        ${analysis.totalFiles}`);
  report.push(`Total Lines:        ${analysis.totalLines.toLocaleString()}`);
  report.push(`  - Code:           ${analysis.totalCodeLines.toLocaleString()} (${Math.round(analysis.totalCodeLines / (analysis.totalLines || 1) * 100)}%)`);
  report.push(`  - Comments:       ${analysis.totalCommentLines.toLocaleString()} (${Math.round(analysis.totalCommentLines / (analysis.totalLines || 1) * 100)}%)`);
  report.push(`  - Blank:          ${analysis.totalBlankLines.toLocaleString()} (${Math.round(analysis.totalBlankLines / (analysis.totalLines || 1) * 100)}%)`);
  report.push('');
  
  report.push('📈 CODE METRICS');
  report.push('-'.repeat(40));
  report.push(`Total Functions:    ${analysis.totalFunctions}`);
  report.push(`Total Classes:      ${analysis.totalClasses}`);
  report.push(`Total Imports:      ${analysis.totalImports}`);
  report.push(`Average File Size:  ${analysis.averageFileSize} lines`);
  report.push(`Complexity Score:   ${analysis.complexityScore?.toFixed(2) || 'N/A'}`);
  report.push('');
  
  if (analysis.largestFile) {
    report.push('📁 LARGEST FILE');
    report.push('-'.repeat(40));
    report.push(`${analysis.largestFile.path} (${analysis.largestFile.lines} lines)`);
    report.push('');
  }
  
  report.push('📂 FILES BY TYPE');
  report.push('-'.repeat(40));
  
  const sortedTypes = Object.entries(analysis.filesByType)
    .sort((a, b) => b[1].length - a[1].length);
  
  for (const [ext, files] of sortedTypes) {
    const totalLines = files.reduce((sum, f) => sum + f.lines, 0);
    report.push(`.${ext}: ${files.length} files, ${totalLines} lines`);
  }
  
  report.push('');
  report.push('='.repeat(60));
  
  return report.join('\n');
}

/**
 * تخمین تعداد توکن‌ها برای مدل‌های زبانی
 */
export function estimateTokens(content: string): number {
  // تخمین تقریبی: هر ۴ کاراکتر ≈ ۱ توکن
  // این یک تخمین ساده است و برای دقت بیشتر باید از tokenizer واقعی استفاده کرد
  return Math.ceil(content.length / 4);
}

/**
 * بهینه‌سازی خروجی برای AI (کاهش توکن‌ها)
 */
export function optimizeForAI(content: string, maxTokens?: number): string {
  if (!maxTokens) {
    return content;
  }
  
  const currentTokens = estimateTokens(content);
  if (currentTokens <= maxTokens) {
    return content;
  }
  
  const lines = content.split('\n');
  const targetLines = Math.floor(lines.length * (maxTokens / currentTokens));
  
  // حذف خطوط خالی اضافی و کامنت‌ها
  const optimized = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed !== '' && !trimmed.startsWith('//') && !trimmed.startsWith('#');
  });
  
  // اگر هنوز زیاد است، برش بده
  if (optimized.length > targetLines) {
    return optimized.slice(0, targetLines).join('\n');
  }
  
  return optimized.join('\n');
}
