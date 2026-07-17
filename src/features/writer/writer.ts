export interface Writer {
  write(path: string, content: string): Promise<void>;
}
