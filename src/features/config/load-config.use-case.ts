import type { Repo2TxtConfig } from './config.js';
import { mergeConfig } from './merge-config.js';
import { validateConfig } from './validator.js';
import { loadConfigFile } from './loader.js';

export interface ConfigSources {
  defaults?: Partial<Repo2TxtConfig>;
  file?: Partial<Repo2TxtConfig>;
  environment?: Partial<Repo2TxtConfig>;
  cli?: Partial<Repo2TxtConfig>;
}

export class LoadConfigUseCase {
  public execute(sources: ConfigSources = {}): Repo2TxtConfig {
    const fileConfig = await loadConfigFile(process.cwd());

    const config = mergeConfig({
      ...fileConfig,
      ...sources.defaults,
      ...sources.file,
      ...sources.environment,
      ...sources.cli,
    });
    validateConfig(config);
    return config;
  }
}
