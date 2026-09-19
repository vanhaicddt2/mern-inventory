# ========================
# DEPLOY VPS - HƯỚNG DẪN
# ========================

## 1. CLONE + CÀI DEPENDENCIES

```bash
git clone <your-repo-url> mern-inventory
cd mern-inventory
npm run install:all
```

## 2. CẤU HÌNH ENV

```bash
cp backend/.env.example backend/.env
nano backend/.env
# Điền MONGODB_URI, JWT_SECRET, NODE_ENV=production
```

## 3. BUILD FRONTEND

```bash
npm run build
# Tạo ra frontend/dist/
```

## 4. CHẠY BẰNG PM2

```bash
# Cài PM2 lần đầu
npm install -g pm2

# Khởi động app
pm2 start ecosystem.config.cjs

# Xem logs
pm2 logs inv-server

# Xem status
pm2 status

# Tự khởi động khi reboot VPS
pm2 startup
pm2 save
```

## 5. LỆNH PM2 HỮU ÍCH

```bash
pm2 restart inv-server      # restart
pm2 reload inv-server       # reload không downtime
pm2 stop inv-server         # dừng
pm2 delete inv-server       # xóa khỏi PM2

pm2 logs inv-server         # xem log realtime
pm2 monit                   # dashboard giám sát
```

## 6. UPDATE CODE (deploy lại)

```bash
git pull
npm run build               # build frontend mới
pm2 reload inv-server       # reload không downtime
```

## 7. CHẠY DEV CỤC BỘ

```bash
# Chạy cả server lẫn client cùng lúc
npm run dev
# Backend: http://localhost:5000
# Frontend: http://localhost:5173
```

## CẤU TRÚC PORTS

- Production: chỉ 1 port duy nhất `:5000` (Express serve cả API + Frontend build)
- Dev: Backend `:5000` + Frontend `:5173` (Vite proxy /api về :5000)
