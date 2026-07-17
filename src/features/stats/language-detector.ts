import { extension } from '../../shared/utils/path.js';

export interface LanguageInfo {
  name: string;
  extensions: string[];
  color?: string;
}

export const LANGUAGES: LanguageInfo[] = [
  { name: 'TypeScript', extensions: ['ts', 'tsx'], color: '#3178c6' },
  {
    name: 'JavaScript',
    extensions: ['js', 'jsx', 'mjs', 'cjs'],
    color: '#f7df1e',
  },
  { name: 'Python', extensions: ['py', 'pyw', 'pyx'], color: '#3776ab' },
  { name: 'Java', extensions: ['java', 'class'], color: '#b07219' },
  {
    name: 'C++',
    extensions: ['cpp', 'cc', 'cxx', 'hpp', 'h'],
    color: '#f34b7d',
  },
  { name: 'C', extensions: ['c', 'h'], color: '#555555' },
  { name: 'Go', extensions: ['go'], color: '#00add8' },
  { name: 'Rust', extensions: ['rs'], color: '#dea584' },
  { name: 'Ruby', extensions: ['rb', 'rake'], color: '#701516' },
  { name: 'PHP', extensions: ['php', 'phtml'], color: '#4f5d95' },
  { name: 'HTML', extensions: ['html', 'htm', 'xhtml'], color: '#e34c26' },
  {
    name: 'CSS',
    extensions: ['css', 'scss', 'sass', 'less'],
    color: '#563d7c',
  },
  { name: 'JSON', extensions: ['json', 'jsonc'], color: '#f1c40f' },
  { name: 'YAML', extensions: ['yml', 'yaml'], color: '#cb171e' },
  { name: 'Markdown', extensions: ['md', 'markdown'], color: '#083fa1' },
  {
    name: 'Shell',
    extensions: ['sh', 'bash', 'zsh', 'fish'],
    color: '#89e051',
  },
  { name: 'Dockerfile', extensions: ['dockerfile'], color: '#384d54' },
  { name: 'SQL', extensions: ['sql', 'sqlite'], color: '#e38c00' },
  { name: 'XML', extensions: ['xml', 'xsd', 'xsl'], color: '#0060ac' },
  { name: 'TOML', extensions: ['toml'], color: '#9c4221' },
  { name: 'Plain Text', extensions: ['txt', 'log'], color: '#7f7f7f' },
];

export function detectLanguage(fileName: string): LanguageInfo {
  const ext = extension(fileName).toLowerCase();
  const lang = LANGUAGES.find((l) => l.extensions.includes(ext));
  return lang || { name: 'Unknown', extensions: [ext || 'unknown'] };
}

export function detectLanguageByContent(content: string): string | null {
  // تشخیص ساده بر اساس محتوا
  if (
    content.includes('#!/usr/bin/env node') ||
    content.includes('#!/usr/bin/env node')
  ) {
    return 'JavaScript';
  }
  if (
    content.includes('#!/usr/bin/env python') ||
    content.includes('#!/usr/bin/python')
  ) {
    return 'Python';
  }
  if (content.includes('<!DOCTYPE html') || content.includes('<html')) {
    return 'HTML';
  }
  if (content.includes('@import') || content.includes('@font-face')) {
    return 'CSS';
  }
  if (content.includes('package.json') || content.includes('"dependencies"')) {
    return 'JSON';
  }
  if (content.includes('<?php')) {
    return 'PHP';
  }
  if (content.includes('public class') || content.includes('interface')) {
    return 'Java';
  }
  if (content.includes('#include') || content.includes('main()')) {
    return 'C';
  }
  if (content.includes('fn main()') || content.includes('use std::')) {
    return 'Rust';
  }
  if (content.includes('package main') || content.includes('func main()')) {
    return 'Go';
  }
  return null;
}
