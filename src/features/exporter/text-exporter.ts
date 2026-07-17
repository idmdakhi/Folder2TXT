import type { Exporter } from './exporter.js';
import type { ExportContext } from './export-context.js';
import { TreeBuilder, TreeRenderer } from '../tree/index.js';
import { NodeKind } from '../../core/domain/index.js';

export class TextExporter implements Exporter {
  constructor(private readonly context: ExportContext) {}

  async export(): Promise<string> {
    const sections: string[] = [];

    if (this.context.includeTree) {
      const tree = new TreeBuilder().build(this.context.nodes);
      const rendered = new TreeRenderer().render(tree);
      sections.push('## Repository Tree\n\n' + rendered);
    }

    if (this.context.includeContent && this.context.filesystem) {
      sections.push('## Files\n');
      for (const node of this.context.nodes) {
        if (node.kind === NodeKind.File) {
          try {
            const content = await this.context.filesystem.readText(
              node.absolutePath,
            );
            sections.push(`### ${node.path}\n\`\`\`\n${content}\n\`\`\``);
          } catch {
            sections.push(`### ${node.path}\n[ERROR: Could not read content]`);
          }
        }
      }
    }

    return sections.join('\n\n');
  }
}
