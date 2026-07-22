import { Repo2TextConfig } from "../types";

interface Props {
  config: Repo2TextConfig;
  onChange: (c: Repo2TextConfig) => void;
}

function ListEditor({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <textarea
        className="input textarea"
        placeholder={placeholder}
        value={values.join("\n")}
        onChange={(e) =>
          onChange(
            e.target.value
              .split("\n")
              .map((v) => v.trim())
              .filter(Boolean)
          )
        }
      />
    </div>
  );
}

export function ConfigPanel({ config, onChange }: Props) {
  const set = <K extends keyof Repo2TextConfig>(key: K, value: Repo2TextConfig[K]) =>
    onChange({ ...config, [key]: value });

  return (
    <div className="panel">
      <h3>تنظیمات خروجی</h3>

      <div className="field">
        <label>فرمت خروجی</label>
        <select
          className="input"
          value={config.outputFormat}
          onChange={(e) => set("outputFormat", e.target.value as Repo2TextConfig["outputFormat"])}
        >
          <option value="markdown">Markdown</option>
          <option value="plain">متن ساده</option>
          <option value="xml">XML</option>
        </select>
      </div>

      <div className="field">
        <label>ترتیب فایل‌ها</label>
        <select
          className="input"
          value={config.sortBy}
          onChange={(e) => set("sortBy", e.target.value as Repo2TextConfig["sortBy"])}
        >
          <option value="path">مسیر</option>
          <option value="size">حجم</option>
          <option value="extension">پسوند</option>
        </select>
      </div>

      <div className="field row">
        <label>
          <input
            type="checkbox"
            checked={config.respectGitignore}
            onChange={(e) => set("respectGitignore", e.target.checked)}
          />
          رعایت .gitignore
        </label>
        <label>
          <input
            type="checkbox"
            checked={config.excludeBinary}
            onChange={(e) => set("excludeBinary", e.target.checked)}
          />
          حذف فایل‌های باینری
        </label>
      </div>

      <div className="field row">
        <label>
          <input
            type="checkbox"
            checked={config.includeFileTree}
            onChange={(e) => set("includeFileTree", e.target.checked)}
          />
          درج درخت فایل‌ها
        </label>
        <label>
          <input
            type="checkbox"
            checked={config.includeLineNumbers}
            onChange={(e) => set("includeLineNumbers", e.target.checked)}
          />
          شماره خط
        </label>
      </div>

      <div className="field row">
        <label>
          <input
            type="checkbox"
            checked={config.stripComments}
            onChange={(e) => set("stripComments", e.target.checked)}
          />
          حذف کامنت‌ها (best-effort)
        </label>
      </div>

      <div className="field row">
        <div className="field">
          <label>حداکثر حجم هر فایل (KB)</label>
          <input
            type="number"
            className="input"
            value={config.maxFileSizeKB}
            onChange={(e) => set("maxFileSizeKB", Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label>حداکثر حجم کل خروجی (MB)</label>
          <input
            type="number"
            className="input"
            value={config.maxTotalSizeMB}
            onChange={(e) => set("maxTotalSizeMB", Number(e.target.value))}
          />
        </div>
      </div>

      <div className="field">
        <label>Chunk کردن بر اساس تعداد توکن (خالی = بدون chunk)</label>
        <input
          type="number"
          className="input"
          placeholder="مثلا 8000"
          value={config.chunkByTokens ?? ""}
          onChange={(e) => set("chunkByTokens", e.target.value ? Number(e.target.value) : null)}
        />
      </div>

      <ListEditor
        label="الگوهای Include (glob، هر خط یک مورد)"
        values={config.includePatterns}
        onChange={(v) => set("includePatterns", v)}
        placeholder={"src/**/*.ts\n**/*.md"}
      />
      <ListEditor
        label="الگوهای Exclude (glob)"
        values={config.excludePatterns}
        onChange={(v) => set("excludePatterns", v)}
        placeholder={"**/*.test.ts\n**/*.spec.ts"}
      />
      <ListEditor
        label="پسوندهای مجاز (خالی = همه)"
        values={config.includeExtensions}
        onChange={(v) => set("includeExtensions", v)}
        placeholder={".ts\n.tsx\n.md"}
      />
      <ListEditor
        label="پسوندهای حذف‌شده"
        values={config.excludeExtensions}
        onChange={(v) => set("excludeExtensions", v)}
        placeholder={".lock\n.log"}
      />
      <ListEditor
        label="پوشه‌های نادیده‌گرفته‌شده"
        values={config.ignoredDirNames}
        onChange={(v) => set("ignoredDirNames", v)}
        placeholder={"node_modules\ndist"}
      />

      <div className="field">
        <label>متن دلخواه ابتدای خروجی</label>
        <textarea
          className="input textarea"
          value={config.customHeader}
          onChange={(e) => set("customHeader", e.target.value)}
        />
      </div>
      <div className="field">
        <label>متن دلخواه انتهای خروجی</label>
        <textarea
          className="input textarea"
          value={config.customFooter}
          onChange={(e) => set("customFooter", e.target.value)}
        />
      </div>
    </div>
  );
}
