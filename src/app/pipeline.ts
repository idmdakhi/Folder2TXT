import type { Container } from './container.js';
import type { Logger } from '../features/logger/index.js';

export class Pipeline {
  constructor(
    private readonly container: Container,
    private readonly logger?: Logger,
  ) {}

  async execute(): Promise<void> {
    this.logger?.info('Starting repository scan...');
    const scanner = this.container.createScanner();
    const nodes = [];
    for await (const node of scanner.scan()) {
      nodes.push(node);
      this.logger?.debug(`Discovered: ${node.path}`);
    }
    this.logger?.info(`Scanned ${nodes.length} nodes.`);

    this.logger?.info('Exporting...');
    const exporter = this.container.createExporter({
      nodes,
      root: this.container['config'].root,
      includeTree: this.container['config'].renderTree,
      includeContent: true,
    });
    const output = await exporter.export();

    this.logger?.info('Writing output...');
    await this.container.writer.write(this.container['config'].output, output);
    this.logger?.info('Done.');
  }
}
