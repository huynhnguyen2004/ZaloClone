import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./page/AuthPage/AuthPage";
import CustomerLayout from "./layout/CustomerLayout/CustomerLayout";
import AdminLayout from "./layout/AdminLayout/AdminLayout";
import ProfilePage from "./page/ProfilePage/ProfilePage";
import UserProfilePage from "./page/UserProfilePage/UserProfilePage";

import "./App.css";
import { ChatProvider } from "./context/chatContext";
// Admin Pages
import AdminDashboard from "./page/Admin/AdminDashboard/AdminDashboard";
import AdminUsers from "./page/Admin/AdminUsers/AdminUsers";
import AdminSettings from "./page/Admin/AdminSettings/AdminSettings";
import { UserProvider } from "./context/userContext";
import { FriendProvider } from "./context/friendContext";
import { NotificationProvider } from "./context/notificationContext";


function App() {
  return (
    <UserProvider>
      <ChatProvider>
        <FriendProvider>
           <NotificationProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AuthPage />} />
              <Route path="/auth" element={<AuthPage />} />

              <Route path="/home" element={<CustomerLayout />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/user/:userId" element={<UserProfilePage />} />

              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
            </Routes>
          </BrowserRouter>
           </NotificationProvider>
        </FriendProvider>
      </ChatProvider>
    </UserProvider>
  );
}

export default App;
