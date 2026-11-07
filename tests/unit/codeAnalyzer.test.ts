import { analyzeFile, analyzeProject, estimateTokens, generateAnalysisReport, optimizeForAI } from '../../src/services/codeAnalyzer';

describe('code analysis', () => {
  it.each([{ path: 'empty.ts' }, { path: 'empty.ts', content: '' }, { path: 'image.png', content: 'binary', isBinary: true }])('skips unavailable text: %j', file => {
    expect(analyzeFile(file)).toBeNull();
  });

  it.each([
    ['TS', '// comment\nimport x from "x";\nfunction run() {}\nconst next = () => 1;\nclass Example {}\n', 2, 1, 1],
    ['py', '# comment\nfrom os import path\nasync def run():\nclass Example:\n', 1, 1, 1],
    ['java', '// comment\nimport java.util.List;\npublic void run() {}\npublic class Example {}\n', 1, 1, 1],
    ['php', '# comment\nuse Example;\npublic function run() {}\ntrait Example {}\n', 1, 1, 1],
    ['rb', '# comment\nrequire "x"\ndef run\nmodule Example\n', 1, 1, 1],
    ['sh', '# comment\nsource ./env\nrun() {}\n', 1, 0, 1],
    ['sql', '-- comment\nUSE example\ncreate function run()\n', 1, 0, 1],
    ['custom', '# comment\nimport example\nfn run\nstruct Example\n', 1, 1, 1],
  ])('recognizes %s line categories and declarations', (ext, content, functions, classes, imports) => {
    const result = analyzeFile({ path: `src/example.${ext}`, content })!;
    expect(result).toMatchObject({ extension: ext.toLowerCase(), functions, classes, imports, commentLines: 1, blankLines: 1 });
    expect(result.lines).toBe(content.split('\n').length);
    expect(result.codeLines + result.commentLines + result.blankLines).toBe(result.lines);
  });

  it('aggregates only text files and keeps the first largest file on ties', () => {
    const result = analyzeProject([
      { path: 'a.ts', content: '// note\nfunction run() {}\n' },
      { path: 'b.py', content: 'if ready:\n  run()\n' },
      { path: 'c.ts', content: 'class Example {}' },
      { path: 'empty.ts', content: '' }, { path: 'x.bin', content: 'x', isBinary: true },
    ]);
    expect(result).toMatchObject({ totalFiles: 3, totalLines: 7, totalCodeLines: 4, totalCommentLines: 1, totalBlankLines: 2, totalFunctions: 1, totalClasses: 1, totalImports: 0, averageFileSize: 2, largestFile: { path: 'a.ts', lines: 3 }, complexityScore: 0.14 });
    expect(result.filesByType.ts.map(file => file.path)).toEqual(['a.ts', 'c.ts']);
    expect(result.filesByType.py).toHaveLength(1);
  });

  it('counts independent control-flow categories', () => {
    expect(analyzeFile({ path: 'a.py', content: 'if ready and valid:\nfor item in items:\nexcept Error:\nvalue = 1' })?.complexity).toBe(4);
  });

  it('handles an empty project without NaN percentages', () => {
    const analysis = analyzeProject([]);
    expect(analysis).toMatchObject({ totalFiles: 0, totalLines: 0, averageFileSize: 0, largestFile: null, filesByType: {}, complexityScore: 0 });
    const report = generateAnalysisReport(analysis);
    expect(report).toContain('CODE ANALYSIS REPORT');
    expect(report).toContain('(0%)');
    expect(report).not.toMatch(/NaN|Infinity|LARGEST FILE/);
  });

  it('reports totals, largest file and type summaries', () => {
    const report = generateAnalysisReport(analyzeProject([{ path: 'a.ts', content: 'function run() {}' }]));
    expect(report).toContain('Total Functions:    1');
    expect(report).toContain('a.ts (1 lines)');
    expect(report).toContain('.ts: 1 files, 1 lines');
  });

  it.each([['', 0], ['a', 1], ['abcd', 1], ['abcde', 2]])('estimates token boundary for %j', (content, expected) => {
    expect(estimateTokens(content)).toBe(expected);
  });

  it('preserves content when no budget is given or the exact budget fits', () => {
    expect(optimizeForAI('// a\nx')).toBe('// a\nx');
    expect(optimizeForAI('abcd', 1)).toBe('abcd');
  });

  it('removes blank and comment lines and truncates to the budgeted line count', () => {
    expect(optimizeForAI('// comment\n\n# comment\nfirst\nsecond\nthird', 4)).toBe('first\nsecond');
  });
});
