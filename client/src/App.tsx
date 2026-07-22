import { useState } from "react";
import { AnalyzeResult, GenerateResult, defaultConfig } from "./types";
import { analyzeSession, cloneRepo, generateText, uploadZip } from "./api";
import { SourceInput } from "./components/SourceInput";
import { ConfigPanel } from "./components/ConfigPanel";
import { FileTree } from "./components/FileTree";
import { PreviewPane } from "./components/PreviewPane";
import { StatsBar } from "./components/StatsBar";
import "./styles.css";

export default function App() {
  const [config, setConfig] = useState(defaultConfig);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeResult | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generated, setGenerated] = useState<GenerateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runAnalysis(sid: string) {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeSession(sid, config);
      setAnalysis(result);
      setSelected(new Set(result.files.filter((f) => f.included).map((f) => f.path)));
      setGenerated(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUrl(url: string, branch: string) {
    setLoading(true);
    setError(null);
    try {
      const { sessionId: sid } = await cloneRepo(url, branch || undefined);
      setSessionId(sid);
      await runAnalysis(sid);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    try {
      const { sessionId: sid } = await uploadZip(file);
      setSessionId(sid);
      await runAnalysis(sid);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  function toggleFile(path: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  async function handleGenerate() {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await generateText(sessionId, config, Array.from(selected));
      setGenerated(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>repo2text</h1>
        <p>تبدیل ریپازیتوری یا پروژه به یک فایل متنی یکپارچه، آماده برای مدل‌های زبانی</p>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="layout">
        <aside className="sidebar">
          <SourceInput onSubmitUrl={handleUrl} onSubmitFile={handleFile} loading={loading} />
          <ConfigPanel config={config} onChange={setConfig} />
          {sessionId && (
            <button className="btn primary full" disabled={loading} onClick={() => runAnalysis(sessionId)}>
              اعمال تنظیمات و آنالیز مجدد
            </button>
          )}
        </aside>

        <main className="content">
          {analysis && <StatsBar result={analysis} />}

          {analysis && (
            <FileTree
              files={analysis.files}
              selected={selected}
              onToggle={toggleFile}
              onSelectAll={() =>
                setSelected(new Set(analysis.files.filter((f) => f.included).map((f) => f.path)))
              }
              onSelectNone={() => setSelected(new Set())}
            />
          )}

          {analysis && (
            <button className="btn primary full" disabled={loading || selected.size === 0} onClick={handleGenerate}>
              {loading ? "در حال تولید..." : `تولید خروجی از ${selected.size} فایل`}
            </button>
          )}

          <PreviewPane
            chunks={generated?.chunks ?? []}
            totalTokensEstimate={generated?.totalTokensEstimate ?? 0}
            totalChars={generated?.totalChars ?? 0}
          />
        </main>
      </div>
    </div>
  );
}
