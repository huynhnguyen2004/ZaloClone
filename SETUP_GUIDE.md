# Hướng dẫn sử dụng Zalo Clone Layout - Phiên bản cập nhật

## Tổng quan

Dự án đã được cập nhật với UI đẹp và hiện đại, sử dụng React Icons thay vì emoji:

### 1. HeaderCus Component
- **Vị trí**: `src/component/layout/Customer/CustomerHeader.jsx`
- **Chức năng**: 
  - Hiển thị logo Zalo
  - Thanh tìm kiếm
  - Các nút action (gọi điện, video call, thêm)
  - Thông tin người dùng hiện tại với avatar
- **Props**: `currentUser` - thông tin người dùng từ UserContext

### 2. SidebarCus Component  
- **Vị trí**: `src/component/layout/Customer/CustomerSideBar.jsx`
- **Chức năng**:
  - Tab navigation (Chats, Danh bạ, Nhật ký)
  - Thanh tìm kiếm cuộc trò chuyện
  - Bộ lọc (Tất cả, Đã ghim, Đã tắt thông báo)
  - Danh sách chat với avatar, tin nhắn cuối, thời gian, số tin chưa đọc
- **Props**: `currentUser` - thông tin người dùng từ UserContext

### 3. CustomerLayout Component
- **Vị trí**: `src/layout/CustomerLayout/CustomerLayout.jsx`
- **Chức năng**:
  - Tích hợp HeaderCus và SidebarCus
  - Quản lý layout responsive
  - Hiển thị loading và error states
  - Sử dụng UserContext để lấy thông tin người dùng

### 4. UserContext
- **Vị trí**: `src/context/UserContext.js`
- **Chức năng**:
  - Quản lý state người dùng hiện tại
  - Tự động lấy thông tin user từ session token
  - Cung cấp các method: login, logout, updateUser, fetchCurrentUser
  - Handle loading và error states

## Cách sử dụng

### 1. Khởi chạy ứng dụng
\`\`\`bash
npm start
\`\`\`

### 2. Truy cập các route
- **Trang đăng nhập**: `http://localhost:3000/`
- **Trang chủ chat**: `http://localhost:3000/home`
- **Trang thông tin user (test)**: `http://localhost:3000/home/profile`

### 3. Luồng hoạt động
1. Người dùng đăng nhập tại `/` → lưu token vào sessionStorage
2. Chuyển hướng đến `/home`
3. UserContext tự động:
   - Lấy token từ sessionStorage
   - Gọi API `getCurrentUser()` với token trong header Authorization
   - Cập nhật state currentUser
4. HeaderCus và SidebarCus nhận currentUser từ props
5. Hiển thị thông tin người dùng trong giao diện

### 4. API Integration
- **Endpoint**: `/api/user/me` (GET)
- **Authentication**: Bearer token từ sessionStorage
- **Service**: `src/api/service/userService.js`
- **Base URL**: `http://localhost:8080` (có thể thay đổi trong `src/api/api.js`)

## Cấu trúc thư mục

\`\`\`
src/
├── api/
│   ├── api.js                 # Axios config với interceptor
│   └── service/
│       └── userService.js     # Service lấy thông tin user
├── component/
│   ├── layout/
│   │   └── Customer/
│   │       ├── CustomerHeader.jsx
│   │       ├── CustomerHeader.css
│   │       ├── CustomerSideBar.jsx
│   │       └── CustomerSideBar.css
│   └── UserInfo/              # Component test thông tin user
│       ├── UserInfo.jsx
│       └── UserInfo.css
├── context/
│   └── UserContext.js         # Context quản lý user state
├── layout/
│   └── CustomerLayout/
│       ├── CustomerLayout.jsx
│       └── CustomerLayout.css
└── App.js                     # Main app với UserProvider
\`\`\`

## Tính năng đã implement

✅ HeaderCus component theo design Zalo với React Icons
✅ SidebarCus component với UI đẹp và empty states
✅ Layout responsive và modern với màu sắc Zalo
✅ UserContext để quản lý state người dùng
✅ Tự động lấy thông tin user từ session token
✅ Loading và error handling
✅ Integration với API backend
✅ Đã xóa mock data, UI clean và professional
✅ Sử dụng React Icons thay vì emoji

## Tính năng có thể mở rộng

- Thêm real-time chat với WebSocket
- Implement các tab Danh bạ và Nhật ký
- Thêm dropdown menu cho user actions
- Implement search functionality
- Thêm notification system
- Mobile responsive improvements
