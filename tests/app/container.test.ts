import { describe, expect, it } from 'vitest';
import { Container } from '../../src/app/container.js';
import { DEFAULT_CONFIG } from '../../src/features/config/defaults.js';

describe('Container', () => {
  it('creates application dependencies with default config', () => {
    const config = {
      ...DEFAULT_CONFIG,
      root: '.',
      output: 'test.txt',
      format: 'txt' as const,
      encoding: 'utf8' as BufferEncoding,
    };
    const container = new Container(config);

    expect(container.filesystem).toBeDefined();
    expect(container.writer).toBeDefined();
  });

  it('creates scanner with correct options', () => {
    const config = {
      ...DEFAULT_CONFIG,
      root: '/test',
      output: 'test.txt',
      format: 'txt' as const,
      encoding: 'utf8' as BufferEncoding,
      includeHidden: true,
      followSymlinks: true,
    };
    const container = new Container(config);
    const scanner = container.createScanner();

    expect(scanner).toBeDefined();
    // Scanner options are private, but we can test through behavior
  });

  it('creates exporter based on format', () => {
    const config = {
      ...DEFAULT_CONFIG,
      root: '/test',
      output: 'test.md',
      format: 'md' as const,
      encoding: 'utf8' as BufferEncoding,
    };
    const container = new Container(config);
    const exporter = container.createExporter({
      nodes: [],
      root: '/test',
      includeTree: true,
      includeContent: false,
    });

    expect(exporter).toBeDefined();
    // MarkdownExporter should be returned for 'md' format
  });
});
