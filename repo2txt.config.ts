import { defineConfig } from './src/features/config/define-config.js';

export default defineConfig({
  root: './my-project',
  output: 'output/output.md',
  format: 'md',
  includeHidden: true,
  removeComments: true,
  concurrency: 8,
  enableStats: true,
});
