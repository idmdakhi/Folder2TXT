// src/utils/configLoader.ts
// بارگذاری و مدیریت فایل پیکربندی .folder2textrc

import fs from 'fs';
import path from 'path';
import { ProcessOptions } from '../shared/core';
import { TemplateType, TemplateOptions } from '../services/templateManager';

export interface Folder2TextConfig {
  // گزینه‌های پردازش
  ignorePatterns?: string[];
  maxDepth?: number;
  selectedTypes?: string[];
  commonOnly?: boolean;
  cleanMode?: boolean;
  separator?: string;
  
  // گزینه‌های قالب
  template?: TemplateType;
  templateOptions?: TemplateOptions;
  
  // گزینه‌های خروجی
  outputDir?: string;
  outputFile?: string;
  format?: 'txt' | 'md' | 'json' | 'zip' | 'html';
  
  // گزینه‌های AI
  optimizeForAI?: boolean;
  maxTokens?: number;
  
  // گزینه‌های ZIP
  createZip?: boolean;
  zipOptions?: {
    includeStructure?: boolean;
    filename?: string;
  };
  
  // گزینه‌های HTML تعاملی
  createHTML?: boolean;
  htmlFilename?: string;
}

const CONFIG_FILENAMES = [
  '.folder2textrc',
  '.folder2textrc.json',
  'folder2text.config.json',
  '.folder2text.json',
];

/**
 * جستجو و بارگذاری فایل پیکربندی از مسیر داده‌شده تا ریشه
 */
export function loadConfig(searchPath: string): Folder2TextConfig | null {
  let currentDir = searchPath;
  
  while (currentDir !== path.dirname(currentDir)) {
    for (const filename of CONFIG_FILENAMES) {
      const configPath = path.join(currentDir, filename);
      if (fs.existsSync(configPath)) {
        try {
          const content = fs.readFileSync(configPath, 'utf-8');
          const config = JSON.parse(content);
          return validateConfig(config);
        } catch (error) {
          console.warn(`Warning: Invalid config file at ${configPath}: ${(error as Error).message}`);
        }
      }
    }
    currentDir = path.dirname(currentDir);
  }
  
  return null;
}

/**
 * بارگذاری پیکربندی از مسیر مشخص
 */
export function loadConfigFromPath(configPath: string): Folder2TextConfig | null {
  if (!fs.existsSync(configPath)) {
    return null;
  }
  
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(content);
    return validateConfig(config);
  } catch (error) {
    console.error(`Error loading config from ${configPath}: ${(error as Error).message}`);
    return null;
  }
}

/**
 * اعتبارسنجی پیکربندی
 */
function validateConfig(config: any): Folder2TextConfig {
  const validTemplates: TemplateType[] = ['default', 'github', 'llm', 'concise', 'detailed', 'markdown', 'json'];
  const validFormats = ['txt', 'md', 'json', 'zip', 'html'];
  
  const validated: Folder2TextConfig = {};
  
  if (Array.isArray(config.ignorePatterns)) {
    validated.ignorePatterns = config.ignorePatterns.filter((p: string) => typeof p === 'string');
  }
  
  if (typeof config.maxDepth === 'number' && config.maxDepth >= 0) {
    validated.maxDepth = config.maxDepth;
  }
  
  if (Array.isArray(config.selectedTypes)) {
    validated.selectedTypes = config.selectedTypes.filter((t: string) => typeof t === 'string');
  }
  
  if (typeof config.commonOnly === 'boolean') {
    validated.commonOnly = config.commonOnly;
  }
  
  if (typeof config.cleanMode === 'boolean') {
    validated.cleanMode = config.cleanMode;
  }
  
  if (typeof config.separator === 'string') {
    validated.separator = config.separator;
  }
  
  if (validTemplates.includes(config.template)) {
    validated.template = config.template;
  }
  
  if (typeof config.templateOptions === 'object' && config.templateOptions !== null) {
    validated.templateOptions = config.templateOptions;
  }
  
  if (typeof config.outputDir === 'string') {
    validated.outputDir = config.outputDir;
  }
  
  if (typeof config.outputFile === 'string') {
    validated.outputFile = config.outputFile;
  }
  
  if (validFormats.includes(config.format)) {
    validated.format = config.format;
  }
  
  if (typeof config.optimizeForAI === 'boolean') {
    validated.optimizeForAI = config.optimizeForAI;
  }
  
  if (typeof config.maxTokens === 'number' && config.maxTokens > 0) {
    validated.maxTokens = config.maxTokens;
  }
  
  if (typeof config.createZip === 'boolean') {
    validated.createZip = config.createZip;
  }
  
  if (typeof config.zipOptions === 'object' && config.zipOptions !== null) {
    validated.zipOptions = config.zipOptions;
  }
  
  if (typeof config.createHTML === 'boolean') {
    validated.createHTML = config.createHTML;
  }
  
  if (typeof config.htmlFilename === 'string') {
    validated.htmlFilename = config.htmlFilename;
  }
  
  return validated;
}

/**
 * تبدیل پیکربندی به ProcessOptions
 */
export function configToProcessOptions(config: Folder2TextConfig): ProcessOptions {
  const options: ProcessOptions = {};
  
  if (config.ignorePatterns) {
    options.ignorePatterns = config.ignorePatterns;
  }
  
  if (config.maxDepth !== undefined) {
    options.maxDepth = config.maxDepth;
  }
  
  if (config.selectedTypes) {
    options.selectedTypes = config.selectedTypes;
  }
  
  if (config.commonOnly !== undefined) {
    options.commonOnly = config.commonOnly;
  }
  
  if (config.cleanMode !== undefined) {
    options.cleanMode = config.cleanMode;
  }
  
  if (config.separator) {
    options.separator = config.separator;
  }
  
  return options;
}

/**
 * ایجاد فایل پیکربندی پیش‌فرض
 */
export function createDefaultConfig(outputPath: string): string {
  const defaultConfig: Folder2TextConfig = {
    ignorePatterns: [
      'node_modules',
      '.git',
      'dist',
      'build',
      '*.log',
      '*.lock'
    ],
    maxDepth: 10,
    commonOnly: false,
    cleanMode: false,
    separator: '--- {filename} ---',
    template: 'default',
    templateOptions: {
      includeTree: true,
      includeOverview: true,
      includeContent: true,
      includeLineNumbers: false,
      maxFileLength: 10000
    },
    format: 'txt',
    optimizeForAI: false,
    maxTokens: 100000,
    createZip: false,
    createHTML: false
  };
  
  const content = JSON.stringify(defaultConfig, null, 2);
  fs.writeFileSync(outputPath, content, 'utf-8');
  return outputPath;
}

/**
 * ادغام چند پیکربندی با اولویت
 */
export function mergeConfigs(...configs: (Folder2TextConfig | null)[]): Folder2TextConfig {
  const result: Folder2TextConfig = {};
  
  for (const config of configs) {
    if (!config) continue;
    
    for (const key in config) {
      if (config.hasOwnProperty(key)) {
        const value = (config as any)[key];
        if (value !== undefined && value !== null) {
          (result as any)[key] = value;
        }
      }
    }
  }
  
  return result;
}
