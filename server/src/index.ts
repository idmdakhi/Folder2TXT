import express from "express";
import cors from "cors";
import { cloneRouter } from "./routes/clone.js";
import { uploadRouter } from "./routes/upload.js";
import { analyzeRouter } from "./routes/analyze.js";
import { generateRouter } from "./routes/generate.js";
import { sessionRouter } from "./routes/session.js";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api", cloneRouter);
app.use("/api", uploadRouter);
app.use("/api", analyzeRouter);
app.use("/api", generateRouter);
app.use("/api", sessionRouter);

app.listen(PORT, () => {
  console.log(`repo2text server در حال اجرا روی http://localhost:${PORT}`);
});
