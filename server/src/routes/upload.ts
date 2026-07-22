import { Router } from "express";
import multer from "multer";
import AdmZip from "adm-zip";
import { createSession } from "../services/sessionManager.js";

export const uploadRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
});

uploadRouter.post("/upload", upload.single("archive"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "فایل zip ارسال نشده است" });
    }

    const session = await createSession();
    const zip = new AdmZip(req.file.buffer);
    zip.extractAllTo(session.dir, true);

    res.json({ sessionId: session.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "خطا در استخراج فایل zip" });
  }
});
