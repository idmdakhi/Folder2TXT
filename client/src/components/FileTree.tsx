import { FileEntry } from "../types";

interface Props {
  files: FileEntry[];
  selected: Set<string>;
  onToggle: (path: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function FileTree({ files, selected, onToggle, onSelectAll, onSelectNone }: Props) {
  const includable = files.filter((f) => f.included);
  const excluded = files.filter((f) => !f.included);

  return (
    <div className="panel">
      <div className="tree-header">
        <h3>فایل‌ها ({includable.length} قابل‌شمول)</h3>
        <div>
          <button className="btn small" onClick={onSelectAll}>انتخاب همه</button>
          <button className="btn small" onClick={onSelectNone}>لغو همه</button>
        </div>
      </div>

      <div className="file-list">
        {includable.map((f) => (
          <label key={f.path} className="file-row">
            <input
              type="checkbox"
              checked={selected.has(f.path)}
              onChange={() => onToggle(f.path)}
            />
            <span className="file-path">{f.path}</span>
            <span className="file-meta">
              {formatSize(f.size)} · ~{f.tokens ?? 0} توکن
            </span>
          </label>
        ))}
      </div>

      {excluded.length > 0 && (
        <details className="excluded-details">
          <summary>{excluded.length} فایل حذف‌شده (به دلیل تنظیمات)</summary>
          <div className="file-list muted">
            {excluded.map((f) => (
              <div key={f.path} className="file-row">
                <span className="file-path">{f.path}</span>
                <span className="file-meta">{f.skipReason}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
