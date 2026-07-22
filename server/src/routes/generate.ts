import { Router } from "express";
import { getSession } from "../services/sessionManager.js";
import { walkDirectory } from "../services/fileWalker.js";
import { classifyFiles } from "../services/filterService.js";
import { buildGitignore } from "../utils/gitignoreParser.js";
import { generateOutput } from "../services/formatterService.js";
import { defaultConfig } from "../config/defaultConfig.js";
import { GenerateRequestBody, Repo2TextConfig } from "../types.js";

export const generateRouter = Router();

generateRouter.post("/generate", async (req, res) => {
  try {
    const { sessionId, config: partialConfig, selectedPaths } = req.body as Partial<GenerateRequestBody>;
    if (!sessionId) return res.status(400).json({ error: "sessionId الزامی است" });

    const session = getSession(sessionId);
    if (!session) return res.status(404).json({ error: "session پیدا نشد یا منقضی شده است" });

    const config: Repo2TextConfig = { ...defaultConfig, ...partialConfig };

    const walked = await walkDirectory(session.dir, config.ignoredDirNames);
    const gitignore = config.respectGitignore
      ? await buildGitignore(session.dir, walked.map((w) => w.relPath))
      : null;

    const files = await classifyFiles(walked, config, gitignore);

    const paths = selectedPaths && selectedPaths.length > 0
      ? selectedPaths
      : files.filter((f) => f.included).map((f) => f.path);

    const result = await generateOutput(files, paths, config);

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "خطا در تولید خروجی" });
  }
});
