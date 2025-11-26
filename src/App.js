import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthPage from "./page/AuthPage/AuthPage";
import CustomerLayout from "./layout/CustomerLayout/CustomerLayout";
import AdminLayout from "./layout/AdminLayout/AdminLayout";
import { UserProvider } from "./context/UserContext";
import { RiMessage3Line } from "react-icons/ri";
import "./App.css";

// Component khu vực chat chính
function MainChatView() {
  return (
    <div className="main-chat-view">
      <div className="chat-welcome">
        <RiMessage3Line className="welcome-icon" />
        <h2>Chọn một cuộc trò chuyện</h2>
        <p>Chọn cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn tin</p>
      </div>
    </div>
  );
}

function App() {
  return (
     <BrowserRouter>
    <UserProvider>
        <Routes>
          {/* Trang đăng nhập */}
          <Route path="/" element={<AuthPage />} />

          {/* Layout khách hàng */}
          <Route path="/home" element={<CustomerLayout />}>
            {/* Trang chủ chat */}
            <Route index element={<MainChatView />} />
            {/* Trang thông tin người dùng để test */}
           
            {/* Có thể thêm các route con khác ở đây */}
          </Route>

          {/* Layout admin */}
          <Route path="/admin" element={<AdminLayout />}>
            {/* ví dụ route con của admin */}
            {/* <Route path="dashboard" element={<Dashboard />} /> */}
          </Route>
        </Routes>
         </UserProvider>
      </BrowserRouter>
   
  );
}

export default App;
