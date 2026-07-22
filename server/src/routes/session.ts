import { Router } from "express";
import { destroySession, getSession } from "../services/sessionManager.js";

export const sessionRouter = Router();

sessionRouter.delete("/session/:id", async (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: "session پیدا نشد" });
  await destroySession(req.params.id);
  res.json({ ok: true });
});
