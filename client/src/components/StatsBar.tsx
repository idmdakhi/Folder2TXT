import { AnalyzeResult } from "../types";

export function StatsBar({ result }: { result: AnalyzeResult }) {
  const sizeMB = (result.totalSizeBytes / 1024 / 1024).toFixed(2);
  return (
    <div className="stats-bar">
      <div><strong>{result.totalFiles}</strong> فایل کل</div>
      <div><strong>{result.totalIncluded}</strong> فایل قابل‌شمول</div>
      <div><strong>{sizeMB}</strong> مگابایت</div>
      <div><strong>~{result.totalTokensEstimate.toLocaleString()}</strong> توکن تخمینی</div>
    </div>
  );
}
