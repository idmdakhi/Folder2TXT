import { processFolder } from '../../src/services/folderProcessor';
import { walkDir } from '../../src/services/folderWalker';
import { FileEntry } from '../../src/shared/core';

jest.mock('../../src/services/folderWalker', () => ({ walkDir: jest.fn() }));
const walk = walkDir as jest.Mock;

describe('processFolder returned files', () => {
  beforeEach(() => jest.resetAllMocks());
  it('returns the filtered entries used for output and totals', async () => {
    const files: FileEntry[] = [{ path: 'a.JS', content: 'run();', size: 6 }, { path: 'b.txt', content: 'text', size: 4 }, { path: 'c.js', error: 'unreadable' }];
    walk.mockResolvedValue(files);
    const result = await processFolder('/project', { selectedTypes: ['js'], maxDepth: 0, ignorePatterns: ['dist'] });
    expect(walk).toHaveBeenCalledWith('/project', '/project', ['dist'], 0, 0);
    expect(result.files).toEqual([files[0], files[2]]);
    expect(result).toMatchObject({ fileCount: 2, totalSize: 6 });
    expect(result.content).toContain('run();');
    expect(result.content).not.toContain('b.txt');
  });
  it('exposes cleaned contents to template consumers', async () => {
    walk.mockResolvedValue([{ path: 'a.js', content: '// comment\nconst x = 1;', size: 24 }]);
    const result = await processFolder('/project', { cleanMode: true });
    expect(result.files[0].content).toContain('const x = 1;');
    expect(result.files[0].content).not.toContain('// comment');
  });
  it('returns an empty list when combined filters exclude everything', async () => {
    walk.mockResolvedValue([{ path: 'a.ts', content: 'x' }]);
    expect(await processFolder('/project', { selectedTypes: ['ts'], commonOnly: true })).toMatchObject({ files: [], fileCount: 0, totalSize: 0 });
  });
  it('propagates traversal errors', async () => {
    walk.mockRejectedValue(new Error('unreadable directory'));
    await expect(processFolder('/project')).rejects.toThrow('unreadable directory');
  });
});
