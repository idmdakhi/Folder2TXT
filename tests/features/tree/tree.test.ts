import { describe, expect, it } from 'vitest';
import { TreeBuilder, TreeRenderer } from '../../../src/features/tree/index.js';
import { NodeKind } from '../../../src/core/domain/index.js';

describe('TreeBuilder', () => {
  it('builds tree from nodes', () => {
    const nodes = [
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
    const tree = new TreeBuilder().build(nodes);
    expect(tree.children.length).toBe(1);
    expect(tree.children[0]?.name).toBe('src');
    expect(tree.children[0]?.children[0]?.name).toBe('main.ts');
  });

  it('handles empty node list', () => {
    const tree = new TreeBuilder().build([]);
    expect(tree.children).toEqual([]);
  });
});

describe('TreeRenderer', () => {
  it('renders tree as text', () => {
    const nodes = [
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
        name: 'index.ts',
        path: 'src/index.ts',
        parent: 'src',
        absolutePath: '/project/src/index.ts',
        size: 10,
        modifiedAt: new Date(),
        extension: 'ts',
      },
    ];
    const tree = new TreeBuilder().build(nodes);
    const output = new TreeRenderer().render(tree);
    expect(output).toContain('src');
    expect(output).toContain('index.ts');
  });

  it('renders with icons', () => {
    const nodes = [
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
    ];
    const tree = new TreeBuilder().build(nodes);
    const output = new TreeRenderer().render(tree, { icons: true });
    expect(output).toContain('📁');
  });
});
