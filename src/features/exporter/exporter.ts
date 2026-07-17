export interface Exporter {
  export(): Promise<string>;
}
