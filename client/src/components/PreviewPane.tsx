import { useState } from "react";

interface Props {
  chunks: string[];
  totalTokensEstimate: number;
  totalChars: number;
}

export function PreviewPane({ chunks, totalTokensEstimate, totalChars }: Props) {
  const [activeChunk, setActiveChunk] = useState(0);
  const [copied, setCopied] = useState(false);

  if (chunks.length === 0) {
    return (
      <div className="panel">
        <h3>پیش‌نمایش</h3>
        <p className="hint">هنوز خروجی‌ای تولید نشده است.</p>
      </div>
    );
  }

  const content = chunks[activeChunk] ?? "";

  const copy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = chunks.length > 1 ? `repo-part-${activeChunk + 1}.txt` : "repo.txt";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const downloadAll = () => {
    chunks.forEach((c, i) => {
      const blob = new Blob([c], { type: "text/plain;charset=utf-8" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = chunks.length > 1 ? `repo-part-${i + 1}.txt` : "repo.txt";
      link.click();
      URL.revokeObjectURL(link.href);
    });
  };

  return (
    <div className="panel">
      <div className="tree-header">
        <h3>پیش‌نمایش خروجی</h3>
        <span className="hint">
          ~{totalTokensEstimate.toLocaleString()} توکن · {totalChars.toLocaleString()} کاراکتر
        </span>
      </div>

      {chunks.length > 1 && (
        <div className="tabs">
          {chunks.map((_, i) => (
            <button
              key={i}
              className={i === activeChunk ? "tab active" : "tab"}
              onClick={() => setActiveChunk(i)}
            >
              بخش {i + 1}
            </button>
          ))}
        </div>
      )}

      <pre className="preview">{content}</pre>

      <div className="actions">
        <button className="btn primary" onClick={copy}>
          {copied ? "کپی شد ✓" : "کپی این بخش"}
        </button>
        <button className="btn" onClick={download}>دانلود این بخش</button>
        {chunks.length > 1 && (
          <button className="btn" onClick={downloadAll}>دانلود همه بخش‌ها</button>
        )}
      </div>
    </div>
  );
}
