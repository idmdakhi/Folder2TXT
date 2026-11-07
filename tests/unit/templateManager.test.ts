import { getTemplate, TemplateType } from '../../src/services/templateManager';
import { FileEntry } from '../../src/shared/core';

const files: FileEntry[] = [
  { path: 'src/main.ts', content: 'const x = 1;\nrun();', size: 19 },
  { path: 'image.png', isBinary: true, size: 8 },
  { path: 'bad.txt', error: 'permission denied' },
];

describe('output templates', () => {
  beforeEach(() => { jest.useFakeTimers().setSystemTime(new Date('2026-01-02T03:04:05Z')); });
  afterEach(() => jest.useRealTimers());

  it.each<TemplateType>(['default', 'github', 'llm', 'concise', 'detailed', 'markdown', 'json'])('%s renders empty and populated projects without mutating input', type => {
    const original = JSON.stringify(files);
    expect(getTemplate(type)([], '/project')).toEqual(expect.any(String));
    expect(getTemplate(type)(files, '/project')).toContain('main.ts');
    expect(JSON.stringify(files)).toBe(original);
  });

  it('allows independently disabling default sections', () => {
    expect(getTemplate('default')(files, '/project', { includeOverview: false, includeTree: false, includeContent: false })).toBe('');
    const output = getTemplate('default')(files, '/project', { includeContent: false });
    expect(output).toContain('Total Files: 3');
    expect(output).toContain('  src/\n    main.ts');
    expect(output).not.toContain('const x');
  });

  it.each<TemplateType>(['default', 'github'])('%s truncates long text while representing errors and binary files', type => {
    const output = getTemplate(type)(files, '/project', { maxFileLength: 5 });
    expect(output).toContain('const');
    expect(output).toContain('[truncated]');
    expect(output).not.toContain('run();');
    expect(output).toContain('permission denied');
    expect(output).toMatch(/[Bb]inary|BINARY/);
  });

  it.each<TemplateType>(['github', 'detailed'])('%s adds line numbers only when requested', type => {
    expect(getTemplate(type)(files, '/project', { includeLineNumbers: true })).toContain('   2 | run();');
    expect(getTemplate(type)(files, '/project')).not.toContain('   2 |');
  });

  it('makes markdown an alias of github with stable generation metadata', () => {
    expect(getTemplate('markdown')(files, '/project')).toBe(getTemplate('github')(files, '/project'));
    expect(getTemplate('github')(files, '/project')).toContain('2026-01-02T03:04:05.000Z');
  });

  it('serializes structured JSON and can omit content without losing file metadata', () => {
    const result = JSON.parse(getTemplate('json')(files, '/project'));
    expect(result.metadata).toEqual({ root: '/project', generatedAt: '2026-01-02T03:04:05.000Z', totalFiles: 3, totalSize: 27 });
    expect(result.structure).toEqual({ src: { 'main.ts': null }, 'image.png': null, 'bad.txt': null });
    expect(result.files).toEqual(files);
    const withoutContent = JSON.parse(getTemplate('json')(files, '/project', { includeContent: false }));
    expect(withoutContent.files[0]).toEqual({ path: 'src/main.ts', size: 19 });
  });

  it.each<TemplateType>(['llm', 'concise'])('%s removes comment-only lines and excludes binary/error contents', type => {
    const output = getTemplate(type)([
      { path: 'a.ts', content: '// note\n# note\n\nrun();' },
      { path: 'b.bin', content: 'BINARY_SECRET', isBinary: true },
      { path: 'c.txt', content: 'ERROR_SECRET', error: 'failed' },
    ], '/project');
    expect(output).toContain('run();');
    expect(output).not.toMatch(/\/\/ note|# note|BINARY_SECRET|ERROR_SECRET/);
  });

  it('limits concise output to fifty significant lines', () => {
    const content = Array.from({ length: 51 }, (_, i) => `line ${i + 1}`).join('\n');
    const output = getTemplate('concise')([{ path: 'a.txt', content }], '/project');
    expect(output).toContain('line 50\n');
    expect(output).not.toContain('line 51');
  });
});
