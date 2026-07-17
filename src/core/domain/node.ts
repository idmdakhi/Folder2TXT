import { NodeKind } from './node-kind.js';

export interface RepositoryNode {
  readonly id: string;
  readonly kind: NodeKind;
  readonly name: string;
  readonly path: string;
  readonly parent: string | null;
  readonly absolutePath: string;
  readonly size: number;
  readonly modifiedAt: Date;
  readonly extension: string;
}
