export interface Glob {
  matches(path: string, pattern: string): boolean;
  matchesAny(path: string, patterns: readonly string[]): boolean;
}
