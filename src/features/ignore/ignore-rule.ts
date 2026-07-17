export type IgnoreRuleType = 'include' | 'exclude';

export interface IgnoreRule {
  pattern: string;
  type: IgnoreRuleType;
  caseSensitive: boolean;
  directoryOnly: boolean;
  anchored: boolean;
}
