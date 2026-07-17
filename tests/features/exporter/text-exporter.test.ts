import { describe, expect, it } from 'vitest';
import { TextExporter } from '../../../src/features/exporter/text-exporter.js';
import { MarkdownExporter } from '../../../src/features/exporter/markdown-exporter.js';
import { NodeKind } from '../../../src/core/domain/index.js';

describe('TextExporter', () => {
  const mockNodes = [
    {
      id: '1',
      kind: NodeKind.Directory,
      name: 'src',
      path: 'src',
      parent: null,
      absolutePath: '/project/src',
      size: 0,
      modifiedAt: new Date(),
      extension: '',
    },
    {
      id: '2',
      kind: NodeKind.File,
      name: 'main.ts',
      path: 'src/main.ts',
      parent: 'src',
      absolutePath: '/project/src/main.ts',
      size: 100,
      modifiedAt: new Date(),
      extension: 'ts',
    },
  ];

  it('exports repository tree as text', async () => {
    const exporter = new TextExporter({
      nodes: mockNodes,
      root: '/project',
      includeTree: true,
      includeContent: false,
    });
    const output = await exporter.export();
    expect(output).toContain('Repository Tree');
    expect(output).toContain('src');
    expect(output).toContain('main.ts');
  });

  it('handles empty node list', async () => {
    const exporter = new TextExporter({
      nodes: [],
      root: '/project',
      includeTree: true,
      includeContent: false,
    });
    const output = await exporter.export();
    expect(output).toContain('Repository Tree');
  });
});

describe('MarkdownExporter', () => {
  it('exports repository as markdown', async () => {
    const exporter = new MarkdownExporter({
      nodes: [
        {
          id: '1',
          kind: NodeKind.File,
          name: 'README.md',
          path: 'README.md',
          parent: null,
          absolutePath: '/project/README.md',
          size: 50,
          modifiedAt: new Date(),
          extension: 'md',
        },
      ],
      root: '/project',
      includeTree: true,
      includeContent: false,
    });
    const output = await exporter.export();
    expect(output).toContain('# Repository Export');
    expect(output).toContain('README.md');
  });
});
