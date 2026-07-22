import { Router } from "express";
import { createSession } from "../services/sessionManager.js";
import { cloneRepo } from "../services/gitService.js";

export const cloneRouter = Router();

cloneRouter.post("/clone", async (req, res) => {
  try {
    const { url, branch } = req.body as { url?: string; branch?: string };
    if (!url) {
      return res.status(400).json({ error: "آدرس ریپازیتوری الزامی است" });
    }

    const session = await createSession();
    await cloneRepo(url, session.dir, branch);

    res.json({ sessionId: session.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "خطا در کلون کردن ریپازیتوری" });
  }
});
