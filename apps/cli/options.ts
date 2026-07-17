export interface CliOptions {
  root: string;
  output: string;
  format?: 'txt' | 'md';
  includeHidden?: boolean;
  followSymlinks?: boolean;
  removeComments?: boolean;
  removeBlankLines?: boolean;
}

export function parseArgs(args: string[]): CliOptions {
  const root = args[0] ?? process.cwd();
  const output = args[1] ?? 'repo2txt.txt';
  const format = args.includes('--md') ? 'md' : 'txt';
  return {
    root,
    output,
    format,
    includeHidden: args.includes('--hidden'),
    followSymlinks: args.includes('--follow'),
    removeComments: args.includes('--remove-comments'),
    removeBlankLines: args.includes('--remove-blank-lines'),
  };
}
