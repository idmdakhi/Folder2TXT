FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

# کپی فایل‌های ضروری
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client.html ./
COPY --from=builder /app/assets ./assets

# نصب وابستگی‌های تولید
RUN npm ci --only=production

EXPOSE 3000

# اجرای سرور
CMD ["node", "dist/apps/server/index.js"]
