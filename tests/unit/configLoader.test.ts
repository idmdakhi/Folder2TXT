import fs from 'fs';
import os from 'os';
import path from 'path';
import { configToProcessOptions, createDefaultConfig, loadConfig, loadConfigFromPath, mergeConfigs } from '../../src/utils/configLoader';

describe('configuration loading', () => {
  let directory: string;
  beforeEach(() => { directory = fs.mkdtempSync(path.join(os.tmpdir(), 'folder2txt-config-')); });
  afterEach(() => { jest.restoreAllMocks(); fs.rmSync(directory, { recursive: true, force: true }); });
  const write = (filename: string, value: unknown) => fs.writeFileSync(filename, JSON.stringify(value));

  it.each(['.folder2textrc', '.folder2textrc.json', 'folder2text.config.json', '.folder2text.json'])('discovers %s in a parent directory', filename => {
    write(path.join(directory, filename), { maxDepth: 0 });
    expect(loadConfig(path.join(directory, 'child', 'nested'))).toEqual({ maxDepth: 0 });
  });

  it('prefers the closest directory and the first supported filename', () => {
    const child = path.join(directory, 'child');
    fs.mkdirSync(child);
    write(path.join(directory, '.folder2textrc'), { maxDepth: 9 });
    write(path.join(child, '.folder2textrc.json'), { maxDepth: 2 });
    write(path.join(child, '.folder2textrc'), { maxDepth: 1 });
    expect(loadConfig(child)).toEqual({ maxDepth: 1 });
  });

  it('warns on invalid JSON and continues discovery', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    fs.writeFileSync(path.join(directory, '.folder2textrc'), '{');
    write(path.join(directory, '.folder2textrc.json'), { cleanMode: false });
    expect(loadConfig(directory)).toEqual({ cleanMode: false });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Invalid config file'));
  });

  it('returns null for missing, malformed, or unreadable explicit files', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(loadConfigFromPath(path.join(directory, 'missing'))).toBeNull();
    fs.writeFileSync(path.join(directory, 'bad'), '{');
    expect(loadConfigFromPath(path.join(directory, 'bad'))).toBeNull();
    expect(loadConfigFromPath(directory)).toBeNull();
    expect(error).toHaveBeenCalledTimes(2);
  });

  it('filters invalid fields while preserving false, zero and valid array entries', () => {
    const filename = path.join(directory, 'config.json');
    write(filename, { ignorePatterns: ['dist', 5, null], selectedTypes: [false, 'ts'], maxDepth: 0, commonOnly: false, cleanMode: false, separator: '', template: 'invalid', format: 'invalid', maxTokens: 0, createZip: 'yes', outputDir: 3, unknown: true });
    expect(loadConfigFromPath(filename)).toEqual({ ignorePatterns: ['dist'], selectedTypes: ['ts'], maxDepth: 0, commonOnly: false, cleanMode: false, separator: '' });
  });

  it('round-trips the generated defaults', () => {
    const filename = path.join(directory, 'defaults.json');
    expect(createDefaultConfig(filename)).toBe(filename);
    expect(loadConfigFromPath(filename)).toMatchObject({ maxDepth: 10, template: 'default', format: 'txt', maxTokens: 100000, createHTML: false, createZip: false, templateOptions: { includeContent: true } });
  });

  it('maps processing settings without leaking output settings', () => {
    expect(configToProcessOptions({ maxDepth: 0, commonOnly: false, cleanMode: false, selectedTypes: [], ignorePatterns: [], separator: '|', template: 'json', outputDir: '/out' })).toEqual({ maxDepth: 0, commonOnly: false, cleanMode: false, selectedTypes: [], ignorePatterns: [], separator: '|' });
    expect(configToProcessOptions({})).toEqual({});
  });

  it('merges with later precedence, replacing arrays and preserving explicit false and zero', () => {
    const first = { maxDepth: 5, cleanMode: true, selectedTypes: ['js'] };
    expect(mergeConfigs(first, null, { maxDepth: 0, cleanMode: false, selectedTypes: [], separator: undefined })).toEqual({ maxDepth: 0, cleanMode: false, selectedTypes: [] });
    expect(first).toEqual({ maxDepth: 5, cleanMode: true, selectedTypes: ['js'] });
    expect(mergeConfigs()).toEqual({});
  });
});
