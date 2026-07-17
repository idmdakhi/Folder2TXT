export const DEFAULT_ENCODING = 'utf8' as const;
export const DEFAULT_OUTPUT_FILENAME = 'repo2txt.txt' as const;
export const DEFAULT_MAX_CONCURRENT_TASKS = 4;
export const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024;

export const DEFAULT_INCLUDE_PATTERNS = Object.freeze(['**/*']);
export const DEFAULT_IGNORE_PATTERNS = Object.freeze([
  'node_modules/**',
  '.git/**',
  'dist/**',
  'build/**',
  '.cache/**',
  '.idea/**',
  '.vscode/**',
]);

export const DEFAULT_BINARY_EXTENSIONS = Object.freeze([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'ico',
  'pdf',
  'zip',
  'gz',
  'tar',
  '7z',
  'exe',
  'dll',
  'so',
]);

export const DEFAULT_TREE_BRANCH = '├── ';
export const DEFAULT_TREE_LAST_BRANCH = '└── ';
export const DEFAULT_TREE_VERTICAL = '│   ';
export const DEFAULT_TREE_EMPTY = '    ';
