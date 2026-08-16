# folder2txt

![License](https://img.shields.io/github/license/md-akhi/folder2txt)
![Node Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![Docker](https://img.shields.io/badge/docker-ready-blue)

تبدیل ساختار پوشه و محتوای فایل‌های متنی به یک فایل متنی یکپارچه – با دو روش پردازش: **روی سرور** (با وارد کردن مسیر) و **در مرورگر** (کشیدن و رها کردن پوشه).

## ویژگی‌ها

- ✨ پشتیبانی از دو روش پردازش: سمت سرور و سمت کلاینت (آپلود پوشه در مرورگر)
- 🖥️ **CLI کامل** با دستورات تعاملی و غیرتعاملی
- 🧹 پاک‌سازی خودکار کامنت‌ها و فاصله‌های اضافی (قابل تنظیم)
- 📂 نمایش ساختار درختی پوشه و فایل‌ها در خروجی
- 🔒 امن: محدودیت دسترسی به پوشه‌ها با `BASE_DIR` در حالت سرور
- 📊 لاگینگ پیشرفته با Winston و چرخش روزانه فایل‌های لاگ
- 🐳 آماده برای Docker و اجرا با یک دستور
- 🌐 رابط کاربری واکنش‌گرا با Tailwind CSS و قابلیت شخصی‌سازی
- ⚡ پردازش هم‌زمان فایل‌ها برای افزایش سرعت
- 📁 فیلتر کردن فایل‌ها بر اساس پسوند یا اندازه
- 🔧 پشتیبانی از متغیرهای محیطی برای پیکربندی آسان
- 📝 تولید خروجی با فرمت‌های مختلف (txt، md)
- 🎯 تشخیص خودکار فناوری‌های استفاده‌شده در پروژه
- 📊 نمایش آمار کامل پروژه (تعداد فایل‌ها، حجم، پسوندها)
- 🔍 پشتیبانی از .gitignore برای نادیده‌گیری فایل‌ها
- 🌲 امکان کنترل عمق پیمایش در پوشه‌ها

## نصب و اجرا

### با Node.js

```bash
npm install
cp .env.example .env
# ویرایش .env
npm run build
npm start
```

### استفاده از CLI

```bash
# نصب سراسری (اختیاری)
npm install -g .

# یا اجرای مستقیم
npx folder2txt --help

# دستورات موجود:
folder2txt process <folderPath> -o output.txt  # پردازش پوشه
folder2txt info <folderPath>                    # نمایش اطلاعات پوشه
folder2txt interactive                          # حالت تعاملی

# مثال‌ها:
folder2txt process ./src -o code.txt -t ts,js   # فقط فایل‌های TypeScript و JavaScript
folder2txt process ./src --clean --gitignore    # پاک‌سازی کامنت‌ها و استفاده از .gitignore
folder2txt info ./src                           # نمایش آمار پوشه
folder2txt interactive                          # حالت پرسش و پاسخ
```

### با Docker

```bash
docker build -t folder2txt .
docker run -p 3000:3000 -v $(pwd)/data:/app/data folder2txt
```

## پیکربندی با متغیرهای محیطی

| متغیر                | توضیح                                     | پیش‌فرض                           |
| -------------------- | ----------------------------------------- | --------------------------------- |
| `PORT`               | پورت اجرای برنامه                         | 3000                              |
| `BASE_DIR`           | مسیر پایه برای دسترسی در حالت سرور        | process.cwd()                     |
| `LOG_LEVEL`          | سطح لاگ (debug, info, warn, error)        | info                              |
| `MAX_FILE_SIZE`      | حداکثر حجم فایل برای پردازش (بر حسب بایت) | 10485760 (10MB)                   |
| `ALLOWED_EXTENSIONS` | پسوندهای مجاز (جداشده با کاما)            | .txt,.js,.py,.html,.css,.json,.md |

## استفاده

1. در حالت کلاینت: پوشه خود را در ناحیه مشخص‌شده بکشید و رها کنید.
2. در حالت سرور: مسیر کامل پوشه را وارد کرده و دکمه پردازش را بزنید.
3. فایل خروجی به‌صورت خودکار دانلود می‌شود.

## فناوری‌های استفاده‌شده

- **فرانت‌اند**: HTML، Tailwind CSS، JavaScript (ES6)
- **بک‌اند**: Node.js، Express، TypeScript
- **CLI**: Commander.js، Inquirer، Chalk، Ora
- **پردازش فایل**: `fs`، `path`، `globby`
- **لاگینگ**: Winston + Daily Rotate File
- **کانتینر**: Docker
