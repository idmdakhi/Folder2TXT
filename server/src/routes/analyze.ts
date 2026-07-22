import { Router } from "express";
import { getSession } from "../services/sessionManager.js";
import { walkDirectory } from "../services/fileWalker.js";
import { classifyFiles } from "../services/filterService.js";
import { buildGitignore } from "../utils/gitignoreParser.js";
import { estimateTokens } from "../services/tokenService.js";
import { defaultConfig } from "../config/defaultConfig.js";
import { readFile } from "fs/promises";
import { AnalyzeResult, Repo2TextConfig } from "../types.js";

export const analyzeRouter = Router();

analyzeRouter.post("/analyze", async (req, res) => {
  try {
    const { sessionId, config: partialConfig } = req.body as {
      sessionId?: string;
      config?: Partial<Repo2TextConfig>;
    };
    if (!sessionId) return res.status(400).json({ error: "sessionId الزامی است" });

    const session = getSession(sessionId);
    if (!session) return res.status(404).json({ error: "session پیدا نشد یا منقضی شده است" });

    const config: Repo2TextConfig = { ...defaultConfig, ...partialConfig };

    const walked = await walkDirectory(session.dir, config.ignoredDirNames);
    const gitignore = config.respectGitignore
      ? await buildGitignore(session.dir, walked.map((w) => w.relPath))
      : null;

    const files = await classifyFiles(walked, config, gitignore);

    // تخمین توکن فقط برای فایل‌های واقعا include شده (برای سرعت)
    for (const f of files) {
      if (f.included) {
        try {
          const content = await readFile(f.absPath, "utf-8");
          f.tokens = estimateTokens(content);
        } catch {
          f.tokens = 0;
        }
      }
    }

    const included = files.filter((f) => f.included);
    const result: AnalyzeResult = {
      sessionId,
      files,
      totalFiles: files.length,
      totalIncluded: included.length,
      totalSizeBytes: included.reduce((sum, f) => sum + f.size, 0),
      totalTokensEstimate: included.reduce((sum, f) => sum + (f.tokens || 0), 0),
    };

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "خطا در آنالیز پروژه" });
  }
});
