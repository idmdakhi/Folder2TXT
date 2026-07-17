import { createReadStream } from 'node:fs';
import { access, readFile, readdir, lstat } from 'node:fs/promises';
import type { Readable } from 'node:stream';
import type {
  FileSystem,
  FileInfo,
  DirectoryEntry,
} from '../../features/filesystem/index.js';
import { Repo2TxtError } from '../../shared/errors/index.js';

export class NodeFileSystem implements FileSystem {
  async exists(path: string): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }

  async stat(path: string): Promise<FileInfo> {
    try {
      const info = await lstat(path);
      return {
        size: info.size,
        modifiedAt: info.mtime,
        isDirectory: info.isDirectory(),
        isFile: info.isFile(),
        isSymbolicLink: info.isSymbolicLink(),
      };
    } catch (error) {
      throw new Repo2TxtError(`Cannot stat: ${path}`, {
        code: 'FILESYSTEM_STAT_FAILED',
        cause: error,
      });
    }
  }

  async readDirectory(path: string): Promise<readonly DirectoryEntry[]> {
    try {
      const entries = await readdir(path, { withFileTypes: true });
      return entries.map((entry) => ({
        name: entry.name,
        path: `${path}/${entry.name}`,
        isDirectory: entry.isDirectory(),
        isFile: entry.isFile(),
        isSymbolicLink: entry.isSymbolicLink(),
      }));
    } catch (error) {
      throw new Repo2TxtError(`Cannot read directory: ${path}`, {
        code: 'FILESYSTEM_READ_DIRECTORY_FAILED',
        cause: error,
      });
    }
  }

  async readText(
    path: string,
    encoding: BufferEncoding = 'utf8',
  ): Promise<string> {
    try {
      return await readFile(path, { encoding });
    } catch (error) {
      throw new Repo2TxtError(`Cannot read file: ${path}`, {
        code: 'FILESYSTEM_READ_FILE_FAILED',
        cause: error,
      });
    }
  }

  createReadStream(path: string, encoding?: BufferEncoding): Readable {
    return createReadStream(path, { encoding });
  }
}
