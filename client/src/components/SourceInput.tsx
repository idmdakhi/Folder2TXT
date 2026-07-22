import { useState } from "react";

interface Props {
  onSubmitUrl: (url: string, branch: string) => void;
  onSubmitFile: (file: File) => void;
  loading: boolean;
}

export function SourceInput({ onSubmitUrl, onSubmitFile, loading }: Props) {
  const [mode, setMode] = useState<"git" | "zip">("git");
  const [url, setUrl] = useState("");
  const [branch, setBranch] = useState("");

  return (
    <div className="panel">
      <div className="tabs">
        <button className={mode === "git" ? "tab active" : "tab"} onClick={() => setMode("git")}>
          آدرس گیت
        </button>
        <button className={mode === "zip" ? "tab active" : "tab"} onClick={() => setMode("zip")}>
          آپلود ZIP
        </button>
      </div>

      {mode === "git" ? (
        <div className="stack">
          <input
            className="input"
            placeholder="https://github.com/user/repo.git"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <input
            className="input"
            placeholder="نام برنچ (اختیاری)"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
          />
          <button
            className="btn primary"
            disabled={loading || !url.trim()}
            onClick={() => onSubmitUrl(url.trim(), branch.trim())}
          >
            {loading ? "در حال دریافت..." : "بارگذاری ریپازیتوری"}
          </button>
        </div>
      ) : (
        <div className="stack">
          <input
            type="file"
            accept=".zip"
            className="input"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onSubmitFile(file);
            }}
            disabled={loading}
          />
          <span className="hint">پوشه پروژه را به صورت zip فشرده کرده و آپلود کنید</span>
        </div>
      )}
    </div>
  );
}
