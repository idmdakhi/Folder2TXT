import { ExportContext } from './export-context.js';
import { Exporter } from './exporter.js';

export class JsonExporter implements Exporter {
  constructor(private readonly context: ExportContext) {}

  async export(): Promise<string> {
    return JSON.stringify(
      {
        metadata: { root: this.context.root, total: this.context.nodes.length },
        // tree: this.context.tree,
        files: this.context.nodes,
      },
      null,
      2,
    );
  }
}
