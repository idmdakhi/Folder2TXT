import type { Repo2TxtConfig } from '../features/config/index.js';
import { Container } from './container.js';
import { Pipeline } from './pipeline.js';
import type { Logger } from '../features/logger/index.js';

export class Application {
  constructor(
    private readonly config: Repo2TxtConfig,
    private readonly logger?: Logger,
  ) {}

  async run(): Promise<void> {
    const container = new Container(this.config);
    const pipeline = new Pipeline(container, this.logger);
    await pipeline.execute();
  }
}
