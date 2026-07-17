import type { Repo2TxtConfig } from '../features/config/index.js';
import { Container } from './container.js';
import type { RepositoryNode } from '../core/domain/index.js';

export class RunRepo2TxtUseCase {
  constructor(private readonly config: Repo2TxtConfig) {}

  async execute(): Promise<void> {
    const container = new Container(this.config);
    const scanner = container.createScanner();
    const nodes: RepositoryNode[] = [];
    for await (const node of scanner.scan()) {
      nodes.push(node);
    }
    const exporter = container.createExporter({
      nodes,
      root: this.config.root,
      includeTree: this.config.renderTree,
      includeContent: true,
    });
    const output = await exporter.export();
    await container.writer.write(this.config.output, output);
  }
}
