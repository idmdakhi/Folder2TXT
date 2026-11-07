import fs from 'fs';
import path from 'path';
import os from 'os';
import { EventEmitter } from 'events';
import archiver from 'archiver';
import { generateZip, generateInteractiveHTML } from '../../src/services/zipGenerator';

// Isolate archive orchestration from the ESM-only archiver dependency.
jest.mock('archiver', () => ({ __esModule: true, default: jest.fn() }));

describe('export generation', () => {
  let directory: string;
  beforeEach(() => { directory = fs.mkdtempSync(path.join(os.tmpdir(), 'folder2txt-export-')); });
  afterEach(() => { jest.restoreAllMocks(); fs.rmSync(directory, { recursive: true, force: true }); });

  it.each([{ files: [] }, { files: [{ filename: 'nested/a.txt', content: 'hello' }, { filename: 'empty.txt', content: '' }] }])('appends all entries and resolves only after the output closes: %j', async ({ files }) => {
    const output = new EventEmitter();
    jest.spyOn(fs, 'createWriteStream').mockReturnValue(output as fs.WriteStream);
    const archive = Object.assign(new EventEmitter(), { pipe: jest.fn(), append: jest.fn(), finalize: jest.fn() });
    (archiver as jest.Mock).mockReturnValue(archive);
    const destination = path.join(directory, 'nested', 'out.zip');
    const promise = generateZip(files, destination);
    expect(fs.existsSync(path.dirname(destination))).toBe(true);
    expect(archiver).toHaveBeenCalledWith('zip', { zlib: { level: 9 } });
    expect(archive.pipe).toHaveBeenCalledWith(output);
    expect(archive.append.mock.calls).toEqual(files.map(file => [file.content, { name: file.filename }]));
    expect(archive.finalize).toHaveBeenCalledTimes(1);
    let settled = false;
    void promise.then(() => { settled = true; });
    await Promise.resolve();
    expect(settled).toBe(false);
    output.emit('close');
    await expect(promise).resolves.toBe(destination);
  });

  it('rejects archive errors', async () => {
    jest.spyOn(fs, 'createWriteStream').mockReturnValue(new EventEmitter() as fs.WriteStream);
    const archive = Object.assign(new EventEmitter(), { pipe: jest.fn(), finalize: jest.fn() });
    (archiver as jest.Mock).mockReturnValue(archive);
    const promise = generateZip([], path.join(directory, 'out.zip'));
    archive.emit('error', new Error('compression failed'));
    await expect(promise).rejects.toThrow('compression failed');
  });

  it('creates the HTML output directory and preserves exported file metadata', async () => {
    const files = [{ path: 'a.ts', content: 'const x = "hello";\n', size: 19 }, { path: 'b.png', isBinary: true, size: 8 }, { path: 'c.txt', error: 'unreadable' }];
    const destination = await generateInteractiveHTML(files, path.join(directory, 'viewer'));
    expect(destination).toBe(path.join(directory, 'viewer', 'project-viewer.html'));
    const html = fs.readFileSync(destination, 'utf8');
    const data = html.match(/const files=(.*?);function renderStats/s)![1];
    expect(JSON.parse(data)).toEqual(files);
    expect(html).toContain('<!DOCTYPE html>');
  });

  it('supports a custom HTML filename and an empty project', async () => {
    const destination = await generateInteractiveHTML([], directory, 'empty.html');
    expect(destination).toBe(path.join(directory, 'empty.html'));
    expect(fs.readFileSync(destination, 'utf8')).toContain('const files=[];');
  });
});
