import type { RepositoryNode } from '../../core/domain/index.js';
import type { Scanner } from './scanner.js';
import type { ScanOptions } from './scan-options.js';
import type { ScanResult } from './scan-result.js';

export class ScanRepositoryUseCase {
  constructor(
    private readonly scannerFactory: (options: ScanOptions) => Scanner,
  ) {}

  execute(options: ScanOptions): AsyncIterable<RepositoryNode> {
    const scanner = this.scannerFactory(options);
    return scanner.scan();
  }

  async executeWithResult(options: ScanOptions): Promise<{
    nodes: RepositoryNode[];
    result: ScanResult;
  }> {
    const scanner = this.scannerFactory(options);
    const nodes: RepositoryNode[] = [];
    for await (const node of scanner.scan()) {
      nodes.push(node);
    }
    return { nodes, result: scanner.result() };
  }
}
