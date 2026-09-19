# InvManager — Ứng dụng quản lý kinh doanh (MERN Stack)

Web app quản lý **nhập hàng / bán hàng / chi phí / doanh thu** theo từng danh mục sản phẩm (Phone, Màn hình, Other...), xây dựng bằng **React + Node.js + Express + MongoDB**, có đăng nhập, giao diện hiện đại (dark UI), và có thể **cài đặt như một App trên điện thoại (PWA)**.

## Tính năng

- 🔐 Đăng nhập / Đăng ký tài khoản (JWT, mật khẩu mã hoá bcrypt). Người dùng đầu tiên tự động là `admin`.
- 🗂️ Quản lý danh mục lớn tuỳ ý (mặc định: Phone / Màn hình / Other).
- 📦 Trong mỗi danh mục: quản lý danh sách sản phẩm, tồn kho, cảnh báo sắp hết hàng.
- 🧾 Với mỗi sản phẩm: theo dõi **phiếu nhập hàng**, **đơn bán hàng**, và **chi phí phát sinh riêng** (vận chuyển, sửa chữa, marketing...), tự tính lợi nhuận.
- 📊 Thống kê doanh thu / lợi nhuận theo **tháng** và theo **năm**, biểu đồ theo danh mục.
- 📱 **PWA (Progressive Web App)** — có thể "Cài đặt lên màn hình chính" trên Chrome điện thoại, hoạt động như 1 app riêng.

## Cấu trúc thư mục

```
mern-inventory/
├── backend/     # Node.js + Express + MongoDB (Mongoose)
└── frontend/    # React + Vite + TailwindCSS + PWA
```

## Cài đặt & chạy thử (local)

### 1. Yêu cầu
- Node.js >= 18
- MongoDB (chạy local qua `mongod`, hoặc dùng MongoDB Atlas miễn phí)

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Mở .env, chỉnh MONGO_URI trỏ tới MongoDB của bạn (local hoặc Atlas) và JWT_SECRET
npm run seed     # tạo sẵn 3 danh mục: Phone / Màn hình / Other
npm run dev      # chạy server tại http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev      # chạy tại http://localhost:5173
```

Frontend đã cấu hình proxy `/api` → `http://localhost:5000`, nên chỉ cần chạy đồng thời 2 lệnh `npm run dev` ở 2 terminal.

### 4. Tài khoản đầu tiên

Vào `http://localhost:5173/register`, tạo tài khoản đầu tiên — tài khoản này sẽ tự động có quyền **admin**.

## Cài đặt thành "Mini App" trên điện thoại (PWA)

Sau khi deploy frontend lên một domain HTTPS (Vercel, Netlify, VPS + Nginx + SSL...):

1. Mở website bằng **trình duyệt Chrome trên điện thoại**.
2. Chạm vào menu (⋮) góc phải trên → chọn **"Cài đặt ứng dụng"** hoặc **"Thêm vào Màn hình chính"**.
3. App sẽ xuất hiện như 1 icon riêng, mở toàn màn hình như app native, hoạt động cả khi mất mạng nhờ Service Worker (cache tài nguyên tĩnh).

> Lưu ý: PWA installable **bắt buộc chạy qua HTTPS** (trừ localhost khi dev). Khi build production (`npm run build`), thay 2 file icon trong `frontend/public/icons/icon-192.png` và `icon-512.png` bằng logo thật của bạn.

## Build & Deploy

**Backend:** deploy lên Render / Railway / VPS — chạy `npm start`, nhớ set biến môi trường `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`.

**Frontend:**
```bash
cd frontend
npm run build      # tạo thư mục dist/
```
Deploy thư mục `dist/` lên Vercel/Netlify, hoặc phục vụ tĩnh qua Nginx. Nhớ cấu hình biến `VITE_API_URL` hoặc sửa `baseURL` trong `src/api/axios.js` trỏ đúng domain backend khi 2 phần được host ở domain khác nhau.

## Công nghệ sử dụng

| Layer     | Công nghệ |
|-----------|-----------|
| Frontend  | React 18, Vite, React Router, TailwindCSS, Recharts, lucide-react, vite-plugin-pwa |
| Backend   | Node.js, Express, Mongoose |
| Database  | MongoDB |
| Auth      | JWT + bcrypt |

## Mở rộng gợi ý

- Phân quyền chi tiết hơn (nhân viên chỉ xem, admin toàn quyền).
- Upload ảnh sản phẩm (Cloudinary/S3).
- Xuất báo cáo Excel/PDF.
- Thông báo real-time khi sắp hết hàng (Socket.io).
