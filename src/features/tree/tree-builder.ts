import { NodeKind, type RepositoryNode } from '../../core/domain/index.js';
import { normalizePath } from '../../shared/utils/index.js';

export interface TreeNode {
  name: string;
  path: string;
  kind: NodeKind;
  children: readonly TreeNode[];
}

interface MutableTreeNode {
  name: string;
  path: string;
  kind: NodeKind;
  children: MutableTreeNode[];
}

export class TreeBuilder {
  build(nodes: readonly RepositoryNode[]): TreeNode {
    const root: MutableTreeNode = {
      name: '',
      path: '',
      kind: NodeKind.Repository,
      children: [],
    };
    const map = new Map<string, MutableTreeNode>();
    map.set('', root);
    const sorted = [...nodes].sort((a, b) => a.path.localeCompare(b.path));
    for (const node of sorted) {
      const path = normalizePath(node.path);
      const parentPath = this.getParentPath(path);
      const parent = map.get(parentPath) ?? root;
      const treeNode: MutableTreeNode = {
        name: node.name,
        path,
        kind: node.kind,
        children: [],
      };
      parent.children.push(treeNode);
      map.set(path, treeNode);
    }
    return this.freeze(root);
  }

  private getParentPath(path: string): string {
    const idx = path.lastIndexOf('/');
    return idx === -1 ? '' : path.slice(0, idx);
  }

  private freeze(node: MutableTreeNode): TreeNode {
    return {
      name: node.name,
      path: node.path,
      kind: node.kind,
      children: node.children.map((child) => this.freeze(child)),
    };
  }
}
