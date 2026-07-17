import { Repo2TxtError } from '../../shared/errors/index.js';

export class ConfigError extends Repo2TxtError {
  constructor(message: string, options?: any) {
    super(message, { code: 'CONFIG_ERROR', ...options });
    this.name = 'ConfigError';
  }
}

export class ConfigValidationError extends ConfigError {
  constructor(
    message: string,
    public readonly field?: string,
  ) {
    super(message, { code: 'CONFIG_VALIDATION_ERROR', details: { field } });
    this.name = 'ConfigValidationError';
  }
}

export class ConfigNotFoundError extends ConfigError {
  constructor(path?: string) {
    super(
      path
        ? `Configuration file not found: ${path}`
        : 'Configuration not found',
      { code: 'CONFIG_NOT_FOUND' },
    );
    this.name = 'ConfigNotFoundError';
  }
}
