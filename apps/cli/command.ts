import type { CliOptions } from './options.js';

export function buildConfigFromCli(options: CliOptions) {
  return {
    root: options.root,
    output: options.output,
    format: options.format ?? 'txt',
    includeHidden: options.includeHidden ?? false,
    followSymlinks: options.followSymlinks ?? false,
    removeComments: options.removeComments ?? false,
    removeBlankLines: options.removeBlankLines ?? false,
  };
}
