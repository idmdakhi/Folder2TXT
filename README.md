# repo2txt

تبدیل ساختار و محتوای مخزن به یک فایل متنی یا مارک‌دان یکپارچه.

[![CI](https://github.com/your-username/repo2txt/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/repo2txt/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ویژگی‌ها

- اسکن بازگشتی مخزن
- ساخت درخت دایرکتوری
- فیلتر با الگوهای گلوب و نادیده‌گیری (مانند .gitignore)
- خروجی به دو فرمت `txt` و `md`
- امکان حذف کامنت‌ها و فاصله‌های اضافی
- پردازش هم‌زمان با قابلیت تنظیم تعداد تردها
- پشتیبانی از خط فرمان (CLI)
- رابط کاربری وب برای پردازش محلی در مرورگر (کشیدن و رها کردن)
- کاملاً تایپ‌سیفری و مبتنی بر معماری لایه‌ای

## نصب

```bash
npm install -g repo2txt
```

git clone https://github.com/your-username/repo2txt.git
cd repo2txt
npm install
npm run build

repo2txt [root] [output] [--md] [--hidden] [--follow] [--remove-comments] [--remove-blank-lines]

repo2txt . output.txt
repo2txt ./my-project README.md --md --hidden

npm run dev # اجرا با tsx
npm run build # کامپایل
npm run test # اجرای تست‌ها (vitest)
npm run typecheck # بررسی تایپ‌ها
npm run lint # lint
npm run format # prettier
