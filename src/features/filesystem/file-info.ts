export interface FileInfo {
  size: number;
  modifiedAt: Date;
  isDirectory: boolean;
  isFile: boolean;
  isSymbolicLink: boolean;
}
