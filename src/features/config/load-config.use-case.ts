import type { Repo2TxtConfig } from './config.js';
import { mergeConfig } from './merge-config.js';
import { validateConfig } from './validator.js';

export interface ConfigSources {
  defaults?: Partial<Repo2TxtConfig>;
  file?: Partial<Repo2TxtConfig>;
  environment?: Partial<Repo2TxtConfig>;
  cli?: Partial<Repo2TxtConfig>;
}

export class LoadConfigUseCase {
  public execute(sources: ConfigSources = {}): Repo2TxtConfig {
    const config = mergeConfig({
      ...sources.defaults,
      ...sources.file,
      ...sources.environment,
      ...sources.cli,
    });
    validateConfig(config);
    return config;
  }
}
