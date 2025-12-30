import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./page/AuthPage/AuthPage";
import CustomerLayout from "./layout/CustomerLayout/CustomerLayout";
import AdminLayout from "./layout/AdminLayout/AdminLayout";
import ProfilePage from "./page/ProfilePage/ProfilePage";
import UserProfilePage from "./page/UserProfilePage/UserProfilePage";
import { UserProvider } from "./context/UserContext";
import "./App.css";
import { ChatProvider } from "./context/ChatContext";

// Admin Pages
import AdminDashboard from "./page/Admin/AdminDashboard/AdminDashboard";
import AdminUsers from "./page/Admin/AdminUsers/AdminUsers";
import AdminSettings from "./page/Admin/AdminSettings/AdminSettings";

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <ChatProvider>
        <Routes>
          {/* Auth */}
          <Route path="/" element={<AuthPage />} />
          <Route path="/auth" element={<AuthPage />} />
          
          {/* Customer Routes */}
          <Route path="/home" element={<CustomerLayout />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/user/:userId" element={<UserProfilePage />} />
          
          {/* Admin Routes - Nested */}
          <Route path="/admin" element={<AdminLayout />}>
            {/* Redirect /admin to /admin/dashboard */}
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
        </ChatProvider>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;
