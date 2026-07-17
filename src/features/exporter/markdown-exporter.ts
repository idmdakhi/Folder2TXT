import type { Exporter } from './exporter.js';
import type { ExportContext } from './export-context.js';
import { TreeBuilder, TreeRenderer } from '../tree/index.js';
import { NodeKind } from '../../core/domain/index.js';

export class MarkdownExporter implements Exporter {
  constructor(private readonly context: ExportContext) {}

  async export(): Promise<string> {
    const sections: string[] = [];
    sections.push('# Repository Export');
    sections.push(`Root: \`${this.context.root}\``);

    if (this.context.includeTree) {
      const tree = new TreeBuilder().build(this.context.nodes);
      const rendered = new TreeRenderer().render(tree);
      sections.push('## Structure\n\n```text\n' + rendered + '\n```');
    }

    if (this.context.includeContent && this.context.filesystem) {
      sections.push('## Files');
      for (const node of this.context.nodes) {
        if (node.kind === NodeKind.File) {
          try {
            const content = await this.context.filesystem.readText(
              node.absolutePath,
            );
            sections.push(
              `### \`${node.path}\`\n\n\`\`\`${node.extension || 'text'}\n${content}\n\`\`\``,
            );
          } catch {
            sections.push(
              `### \`${node.path}\`\n\n[ERROR: Could not read content]`,
            );
          }
        }
      }
    }

    return sections.join('\n\n');
  }
}
