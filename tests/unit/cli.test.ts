import path from 'path';

// Capture command handlers without parsing argv or opening interactive prompts.
const handlers: Record<string, (...args: any[]) => Promise<void>> = {};
const command: Record<string, jest.Mock> = {};
for (const method of ['name', 'description', 'version', 'option']) command[method] = jest.fn().mockReturnValue(command);
command.command = jest.fn((name: string) => {
  const child = { description: jest.fn(), option: jest.fn(), action: jest.fn() };
  child.description.mockReturnValue(child);
  child.option.mockReturnValue(child);
  child.action.mockImplementation(handler => { handlers[name] = handler; return child; });
  return child;
});
command.parse = jest.fn();
const spinner = { start: jest.fn(), succeed: jest.fn(), fail: jest.fn(), stop: jest.fn(), text: '' };
spinner.start.mockReturnValue(spinner);
const filesystem = { stat: jest.fn(), readFile: jest.fn(), writeFile: jest.fn() };
const processor = jest.fn();
const template = jest.fn();
const chooseTemplate = jest.fn(() => template);
const zip = jest.fn();
const upload = jest.fn();
const validate = jest.fn();
const logger = { error: jest.fn(), warn: jest.fn(), level: 'info' };

beforeAll(() => {
  jest.doMock('commander', () => ({ Command: jest.fn(() => command) }));
  jest.doMock('inquirer', () => ({ prompt: jest.fn() }));
  jest.doMock('chalk', () => ({ red: String, green: String, yellow: String, blue: String, cyan: String, white: String }));
  jest.doMock('ora', () => jest.fn(() => spinner));
  jest.doMock('globby', () => ({ globby: jest.fn() }));
  jest.doMock('fs/promises', () => filesystem);
  jest.doMock('../../src/services/folderProcessor.js', () => ({ processFolder: processor }), { virtual: true });
  jest.doMock('../../src/config/index.js', () => ({ config: {} }), { virtual: true });
  jest.doMock('../../src/utils/logger.js', () => logger, { virtual: true });
  jest.doMock('../../src/shared/core.js', () => ({}), { virtual: true });
  jest.doMock('../../src/services/templateManager.js', () => ({ getTemplate: chooseTemplate }), { virtual: true });
  jest.doMock('../../src/services/zipGenerator.js', () => ({ generateZip: zip }), { virtual: true });
  jest.doMock('../../src/services/githubService.js', () => ({ uploadToGist: upload, validateGithubToken: validate }), { virtual: true });
  jest.doMock('../../src/services/folderWalker.js', () => ({ walkDir: jest.fn().mockResolvedValue([]) }), { virtual: true });
  require('../../src/cli');
});
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit requested'); });
  filesystem.stat.mockResolvedValue({ isDirectory: () => true });
  processor.mockResolvedValue({ files: [{ path: 'a.ts', content: 'x' }], fileCount: 1, totalSize: 1 });
  template.mockReturnValue('formatted output');
});
afterEach(() => jest.restoreAllMocks());
const options = (overrides = {}) => ({ output: 'out.txt', template: 'default', format: 'txt', ...overrides });

describe('CLI process command', () => {
  it('passes parsed options and gitignore patterns to processing and writes the selected template', async () => {
    filesystem.readFile.mockResolvedValue('# comment\n dist \n\n*.log\n');
    await handlers['process <folderPath>']('project', options({ types: ' ts, js, ', ignore: ' cache, ', gitignore: true, maxDepth: '0', clean: true, tree: false, overview: false, json: true }));
    expect(processor).toHaveBeenCalledWith(path.resolve('project'), expect.objectContaining({ selectedTypes: ['ts', 'js'], ignorePatterns: ['cache', 'dist', '*.log'], maxDepth: 0, cleanMode: true }));
    expect(template).toHaveBeenCalledWith([{ path: 'a.ts', content: 'x' }], path.resolve('project'), expect.objectContaining({ includeTree: false, includeOverview: false, includeContent: true }));
    expect(filesystem.writeFile).toHaveBeenCalledWith(path.resolve('out.txt'), 'formatted output', 'utf-8');
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('"success": true'));
  });
  it.each(['export', 'export.zip'])('routes ZIP output for %s to the archive service', async output => {
    await handlers['process <folderPath>']('project', options({ output, format: 'zip' }));
    expect(zip).toHaveBeenCalledWith([{ filename: 'export.txt', content: 'formatted output' }], path.resolve('export.zip'));
    expect(filesystem.writeFile).not.toHaveBeenCalled();
  });
  it.each(['missing', 'file'])('rejects a %s input before processing', async kind => {
    if (kind === 'missing') filesystem.stat.mockRejectedValueOnce(Object.assign(new Error('missing'), { code: 'ENOENT' }));
    else filesystem.stat.mockResolvedValueOnce({ isDirectory: () => false });
    await expect(handlers['process <folderPath>']('bad', options())).rejects.toThrow('exit requested');
    expect(processor).not.toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(1);
    expect(logger.error).toHaveBeenCalled();
  });
  it('continues when the optional gitignore cannot be read', async () => {
    filesystem.readFile.mockRejectedValueOnce(new Error('missing'));
    await handlers['process <folderPath>']('project', options({ gitignore: true }));
    expect(logger.warn).toHaveBeenCalled();
    expect(filesystem.writeFile).toHaveBeenCalled();
  });
});

describe('CLI upload command', () => {
  it('rejects a missing token before contacting GitHub', async () => {
    await expect(handlers['upload <folderPath>']('project', {})).rejects.toThrow('exit requested');
    expect(validate).not.toHaveBeenCalled();
    expect(upload).not.toHaveBeenCalled();
  });
  it('rejects invalid credentials before uploading', async () => {
    validate.mockResolvedValueOnce({ valid: false });
    await expect(handlers['upload <folderPath>']('project', { token: 'synthetic' })).rejects.toThrow('exit requested');
    expect(upload).not.toHaveBeenCalled();
  });
  it('uploads rendered content with explicit Gist settings', async () => {
    validate.mockResolvedValueOnce({ valid: true, username: 'test' });
    upload.mockResolvedValueOnce({ success: true, gistUrl: 'https://gist.github.com/test', gistId: 'test' });
    await handlers['upload <folderPath>']('project', { token: 'synthetic', template: 'github', filename: 'export.md', public: true, description: 'example' });
    expect(chooseTemplate).toHaveBeenCalledWith('github');
    expect(upload).toHaveBeenCalledWith('formatted output', { token: 'synthetic', filename: 'export.md', public: true, description: 'example' });
    expect(spinner.succeed).toHaveBeenCalled();
  });
});
