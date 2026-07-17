export interface Repo2TxtErrorOptions {
  cause?: unknown;
  code?: string;
  details?: unknown;
}

export class Repo2TxtError extends Error {
  public readonly code: string;
  public readonly details?: unknown;
  public override readonly cause?: unknown;

  constructor(message: string, options: Repo2TxtErrorOptions = {}) {
    super(message);
    this.name = new.target.name;
    this.code = options.code ?? 'REPO2TXT_ERROR';
    this.details = options.details;
    this.cause = options.cause;
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, new.target);
    }
  }

  public toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      stack: this.stack,
    };
  }
}
