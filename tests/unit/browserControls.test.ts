import fs from 'fs';
import path from 'path';
import vm from 'vm';

// The browser script is an IIFE. Expose its prototype in this isolated VM only,
// avoiding construction and its unrelated startup event wiring.
const source = fs.readFileSync(path.join(__dirname, '../../assets/js/app.js'), 'utf8');

describe('local file browser controls', () => {
  let controls: any;
  let elements: Record<string, any>;
  let document: { getElementById: jest.Mock; querySelectorAll: jest.Mock };
  beforeEach(() => {
    jest.useFakeTimers();
    elements = {};
    document = { getElementById: jest.fn(id => elements[id]), querySelectorAll: jest.fn(() => []) };
    const context = vm.createContext({ document, setInterval, clearInterval, setTimeout });
    vm.runInContext(source.replace('new FolderTextMerger();', 'globalThis.controls = FolderTextMerger.prototype;'), context);
    controls = Object.create(context.controls);
    controls.files = [];
    controls.selectedTypes = new Set();
    controls.updateProcessButton = jest.fn();
    controls.showFileList = jest.fn();
  });
  afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });
  const element = () => ({ textContent: '', className: '', style: {}, classList: { add: jest.fn(), remove: jest.fn() } });

  it('inverts checked types and refreshes dependent views', () => {
    const boxes = [{ value: 'ts', checked: true }, { value: 'py', checked: false }];
    document.querySelectorAll.mockReturnValue(boxes);
    controls.selectedTypes.add('ts');
    controls.updateStats = jest.fn();
    controls.invertSelection();
    expect(boxes.map(box => box.checked)).toEqual([false, true]);
    expect([...controls.selectedTypes]).toEqual(['py']);
    expect(controls.updateProcessButton).toHaveBeenCalledTimes(1);
    expect(controls.showFileList).toHaveBeenCalledTimes(1);
    expect(controls.updateStats).toHaveBeenCalledTimes(1);
  });
  it.each([[1023, '1023 B'], [1024, '1.0 KB'], [1048576, '1.00 MB']])('formats selected file size at %i bytes', (size, expected) => {
    elements.statsSection = element();
    elements.statTotalSize = element();
    controls.files = [{ size }, { size: 99 }];
    controls.applyFilters = jest.fn(() => [{ size }, {}]);
    controls.selectedTypes.add('ts');
    controls.animateValue = jest.fn();
    controls.updateStats();
    expect(elements.statTotalSize.textContent).toBe(expected);
    expect(controls.animateValue.mock.calls).toEqual([['statTotalFiles', 2], ['statSelectedFiles', 2], ['statFileTypes', 1]]);
  });
  it('hides statistics for empty files and tolerates missing UI elements', () => {
    expect(() => controls.updateStats()).not.toThrow();
    elements.statsSection = element();
    controls.updateStats();
    expect(elements.statsSection.classList.add).toHaveBeenCalledWith('hidden');
    expect(() => controls.showPreview()).not.toThrow();
  });
  it('renders preview content as text and opens the modal', () => {
    elements.previewModal = element();
    elements.previewContent = element();
    controls.mergedContent = '<script>alert(1)</script>';
    controls.showPreview();
    expect(elements.previewContent.textContent).toBe(controls.mergedContent);
    expect(elements.previewModal.classList.remove).toHaveBeenCalledWith('hidden');
  });
  it.each(['success', 'error', 'info', 'unknown'])('hides a %s status after five seconds', type => {
    elements.statusMessage = element(); elements.statusIcon = element(); elements.statusText = element();
    controls.showStatus('message', type);
    expect(elements.statusMessage.style.display).toBe('flex');
    expect(elements.statusText.textContent).toBe('message');
    jest.advanceTimersByTime(5000);
    expect(elements.statusMessage.style.display).toBe('none');
  });
  it('keeps a processing status visible', () => {
    elements.statusMessage = element(); elements.statusIcon = element();
    controls.showStatus('working', 'processing');
    jest.advanceTimersByTime(6000);
    expect(elements.statusMessage.style.display).toBe('flex');
    expect(elements.statusIcon.className).toContain('fa-spin');
  });
  it.each([[0, 100], [100, 0]])('animates from %i to %i and clears the timer on arrival', (start, target) => {
    elements.counter = element(); elements.counter.textContent = String(start);
    controls.animateValue('counter', target);
    jest.advanceTimersByTime(600);
    expect(elements.counter.textContent).toBe(target.toLocaleString('fa-IR'));
    expect(jest.getTimerCount()).toBe(0);
  });
});
