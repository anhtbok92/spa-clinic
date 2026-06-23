# Luxe Spa & Nail - Hệ thống Booking

## Cấu trúc dự án

```
spa-clinic/
├── gas-backend/          # Google Apps Script backend
│   ├── Code.gs           # Main entry point (routing)
│   ├── Auth.gs           # Login & token management
│   ├── Services.gs       # CRUD dịch vụ
│   ├── Staff.gs          # CRUD nhân viên
│   ├── Bookings.gs       # Core booking logic + LockService
│   ├── Customers.gs      # Customer management
│   ├── Utils.gs          # Helper functions
│   └── Setup.gs          # Setup script (chạy 1 lần)
├── client-app/           # App khách hàng (mobile-first PWA)
│   ├── index.html
│   ├── manifest.json
│   ├── css/style.css
│   └── js/
│       ├── config.js
│       ├── api.js
│       ├── app.js
│       └── pages/
│           ├── home.js
│           ├── booking.js
│           └── my-bookings.js
└── admin-app/            # App quản trị
    ├── index.html
    ├── css/admin.css
    └── js/
        ├── config.js
        ├── api.js
        ├── admin-app.js
        └── sections/
            ├── bookings.js
            ├── services.js
            ├── staff.js
            └── customers.js
```

## Hướng dẫn triển khai

### Bước 1: Setup Google Sheets + Apps Script

1. Tạo Google Spreadsheet mới
2. Vào **Extensions → Apps Script**
3. Copy tất cả file `.gs` từ `gas-backend/` vào Apps Script editor
4. Trong Apps Script, vào **Project Settings → Script Properties**, thêm:
   - `SPREADSHEET_ID`: ID của Spreadsheet vừa tạo
   - `ADMIN_EMAIL`: email admin (VD: `admin@spa.com`)
   - `ADMIN_PASSWORD_HASH`: chạy function `generatePasswordHash()` để lấy hash
5. Chạy function `setupSheets()` để tạo cấu trúc bảng + data mẫu
6. **Deploy → New deployment → Web app**
   - Execute as: Me
   - Who has access: Anyone
   - Copy URL deployment

### Bước 2: Cấu hình Frontend

1. Mở `client-app/js/config.js` → thay `API_URL` bằng URL deployment
2. Mở `admin-app/js/config.js` → thay `API_URL` tương tự

### Bước 3: Host Frontend

**Option A - GitHub Pages (miễn phí):**
- Push code lên GitHub
- Settings → Pages → chọn branch → `/client-app` hoặc `/admin-app`

**Option B - Netlify / Vercel:**
- Kết nối repo, deploy `client-app` và `admin-app` riêng biệt

**Option C - Google Drive Hosting:**
- Upload HTML files lên Drive, share public

### Bước 4: Test

- Mở app khách → đặt lịch thử
- Mở admin → đăng nhập → xem lịch hẹn, quản lý dịch vụ/nhân viên

## Tài khoản Admin mặc định

- Email: `admin@spa.com`
- Password: `admin123` (nhớ đổi sau khi deploy)

## Tính năng

### App Khách hàng
- ✅ Trang chủ với banner carousel + danh sách dịch vụ
- ✅ Đặt lịch 3 bước (chọn dịch vụ → ngày/giờ/KTV → xác nhận)
- ✅ Tra cứu lịch hẹn bằng SĐT
- ✅ Hủy lịch (trước giờ hẹn 2 tiếng)
- ✅ Mobile-first, dark theme sang trọng

### Admin Dashboard
- ✅ Login bảo mật (token + CacheService)
- ✅ Quản lý lịch hẹn (xem, đổi trạng thái, thêm mới)
- ✅ CRUD dịch vụ
- ✅ CRUD nhân viên
- ✅ Xem khách hàng + lịch sử booking
- ✅ Responsive (desktop + tablet)

### Backend
- ✅ LockService chống trùng lịch
- ✅ Server-side slot validation
- ✅ Token-based auth (CacheService, TTL 6h)
- ✅ Auto-create customer khi đặt lần đầu
