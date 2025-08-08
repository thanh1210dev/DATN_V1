# 🚀 HƯỚNG DẪN CHẠY DỰ ÁN DATN-POLO

## 📋 YÊU CẦU HỆ THỐNG

### ✅ Phần mềm cần thiết:
- **Java JDK 17** (Spring Boot 3.4.3 yêu cầu Java 17+)
- **Node.js 16+** và **npm/yarn**
- **SQL Server** (hoặc SQL Server Express)
- **Maven** (có sẵn wrapper trong dự án)
- **Git** (để clone và quản lý code)

### ✅ IDE khuyến nghị:
- **IntelliJ IDEA** hoặc **Eclipse** (cho Backend)
- **VS Code** (cho Frontend)

---

## 🗄️ THIẾT LẬP DATABASE

### 1. Cài đặt SQL Server
```bash
# Tải SQL Server Express (miễn phí)
# https://www.microsoft.com/en-us/sql-server/sql-server-downloads
```

### 2. Tạo Database
```sql
-- Kết nối vào SQL Server Management Studio (SSMS)
-- Tạo database mới
CREATE DATABASE DATN4;
GO

-- Tạo user (nếu chưa có)
CREATE LOGIN sa1 WITH PASSWORD = '123456';
USE DATN4;
CREATE USER sa1 FOR LOGIN sa1;
ALTER ROLE db_owner ADD MEMBER sa1;
```

### 3. Kiểm tra kết nối
- **Server**: `localhost`
- **Database**: `DATN4`
- **Username**: `sa1`
- **Password**: `123456`

---

## ⚙️ CHẠY BACKEND (Spring Boot)

### 1. Mở Terminal/Command Prompt
```bash
# Di chuyển vào thư mục backend
cd "c:\Users\Admin\Desktop\DATNV1\DATN-main\DATN-MAIN-POLO"
```

### 2. Kiểm tra cấu hình application.yml
```yaml
# File: src/main/resources/application.yml
spring:
  datasource:
    url: jdbc:sqlserver://localhost;databaseName=DATN4;trustServerCertificate=true
    username: sa1
    password: 123456
```

### 3. Chạy Backend bằng Maven
```bash
# Cách 1: Sử dụng Maven Wrapper (khuyến nghị)
./mvnw spring-boot:run

# Cách 2: Nếu có Maven global
mvn spring-boot:run

# Cách 3: Trên Windows
mvnw.cmd spring-boot:run
```

### 4. Kiểm tra Backend
- **URL**: http://localhost:8080
- **API Health Check**: http://localhost:8080/actuator/health
- **Swagger UI** (nếu có): http://localhost:8080/swagger-ui.html

---

## 🎨 CHẠY FRONTEND (React + Vite)

### 1. Mở Terminal mới
```bash
# Di chuyển vào thư mục frontend
cd "c:\Users\Admin\Desktop\DATNV1\DATN-main\Frontend\vite-project"
```

### 2. Cài đặt Dependencies
```bash
# Cài đặt tất cả packages
npm install

# Hoặc nếu dùng yarn
yarn install
```

### 3. Chạy Frontend
```bash
# Chạy development server
npm run dev

# Hoặc nếu dùng yarn
yarn dev
```

### 4. Kiểm tra Frontend
- **URL**: http://localhost:3000
- **Vite Dev Server** sẽ tự động reload khi có thay đổi

---

## 🔧 CÁCH CHẠY NHANH (Recommended)

### 1. Chạy Backend
```bash
# Terminal 1: Backend
cd "c:\Users\Admin\Desktop\DATNV1\DATN-main\DATN-MAIN-POLO"
./mvnw spring-boot:run
```

### 2. Chạy Frontend
```bash
# Terminal 2: Frontend (mở terminal mới)
cd "c:\Users\Admin\Desktop\DATNV1\DATN-main\Frontend\vite-project"
npm install && npm run dev
```

---

## 🌐 TRUY CẬP ỨNG DỤNG

### 🎯 Các URL chính:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Database**: localhost:1433

### 🔐 Thông tin đăng nhập (nếu có):
- Kiểm tra trong database hoặc tạo tài khoản mới qua API

---

## 🐛 XỬ LÝ LỖI THƯỜNG GẶP

### ❌ Backend không chạy được:
```bash
# Kiểm tra Java version
java -version
# Phải là Java 17+

# Kiểm tra port 8080 có bị chiếm không
netstat -ano | findstr :8080

# Xóa target và rebuild
./mvnw clean install
```

### ❌ Frontend không chạy được:
```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install

# Kiểm tra Node version
node -v
npm -v
```

### ❌ Database connection failed:
```sql
-- Kiểm tra SQL Server service đang chạy
-- Kiểm tra firewall
-- Kiểm tra connection string trong application.yml
```

### ❌ Port bị chiếm:
```bash
# Kill process đang sử dụng port
# Port 8080 (Backend)
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Port 3000 (Frontend)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## 📝 GHI CHÚ QUAN TRỌNG

### ⚠️ Thứ tự chạy:
1. **Đầu tiên**: Khởi động SQL Server
2. **Thứ hai**: Chạy Backend (Spring Boot)
3. **Cuối cùng**: Chạy Frontend (React)

### 🔄 Development Workflow:
1. Backend tự động restart khi có thay đổi code (Spring Boot DevTools)
2. Frontend tự động reload khi có thay đổi (Vite HMR)
3. Database schema tự động update (ddl-auto: update)

### 📊 Monitoring:
- Backend logs trong terminal
- Frontend logs trong browser console
- Database logs trong SQL Server Management Studio

---

## 🎉 HOÀN THÀNH!

Nếu tất cả đều chạy thành công, bạn sẽ thấy:
- ✅ Backend running on http://localhost:8080
- ✅ Frontend running on http://localhost:3000
- ✅ Database connected successfully

**Happy Coding! 🚀**
