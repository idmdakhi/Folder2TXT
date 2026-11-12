import express from "express";
// Import صریح ejs تا pkg بتواند موتور قالب را در فایل اجرایی قرار دهد
import "ejs";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";
import expressLayouts from "express-ejs-layouts";
import { config } from "./config";
import routes from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import logger from "./utils/logger";

const app = express();

// تنظیم موتور قالب
app.use(expressLayouts);
app.set("layout", "layouts/main");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

// فایل‌های استاتیک
app.use(express.static(path.join(__dirname, "../assets")));

// امنیت
app.use(helmet());
app.use(cors());

// محدودیت نرخ
app.use(rateLimit(config.rateLimit));

// لاگینگ
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  }),
);

// بدنه
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// مسیرها
app.use("/", routes);

// مدیریت خطاها
app.use(errorHandler);

export default app;
