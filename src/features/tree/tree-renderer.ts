import { NodeKind } from '../../core/domain/index.js';
import type { TreeNode } from './tree-builder.js';
import {
  DEFAULT_TREE_BRANCH,
  DEFAULT_TREE_LAST_BRANCH,
  DEFAULT_TREE_VERTICAL,
  DEFAULT_TREE_EMPTY,
} from '../../shared/constants.js';

export interface TreeRenderOptions {
  icons?: boolean;
}

export class TreeRenderer {
  render(root: TreeNode, options: TreeRenderOptions = {}): string {
    const lines: string[] = [];
    const children = root.children;
    children.forEach((child, index) => {
      this.renderNode(child, '', index === children.length - 1, lines, options);
    });
    return lines.join('\n');
  }

  private renderNode(
    node: TreeNode,
    prefix: string,
    last: boolean,
    lines: string[],
    options: TreeRenderOptions,
  ): void {
    const branch = last ? DEFAULT_TREE_LAST_BRANCH : DEFAULT_TREE_BRANCH;
    lines.push(prefix + branch + this.displayName(node, options));
    const children = node.children;
    children.forEach((child, index) => {
      this.renderNode(
        child,
        prefix + (last ? DEFAULT_TREE_EMPTY : DEFAULT_TREE_VERTICAL),
        index === children.length - 1,
        lines,
        options,
      );
    });
  }

  private displayName(node: TreeNode, options: TreeRenderOptions): string {
    if (!options.icons) return node.name;
    if (node.kind === NodeKind.Directory) return `📁 ${node.name}`;
    if (node.kind === NodeKind.File) return `📄 ${node.name}`;
    return node.name;
  }
}
