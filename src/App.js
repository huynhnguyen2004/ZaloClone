import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./page/AuthPage/AuthPage";
import CustomerLayout from "./layout/CustomerLayout/CustomerLayout";
import AdminLayout from "./layout/AdminLayout/AdminLayout";
import ProfilePage from "./page/ProfilePage/ProfilePage";
import UserProfilePage from "./page/UserProfilePage/UserProfilePage";

import { SocialProvider } from "./context/socialContext";
import "./App.css";
import { ChatProvider } from "./context/chatContext";
import { AuthProvider } from "./context/authContext";
// Admin Pages
import AdminDashboard from "./page/Admin/AdminDashboard/AdminDashboard";
import AdminUsers from "./page/Admin/AdminUsers/AdminUsers";
import AdminSettings from "./page/Admin/AdminSettings/AdminSettings";


function App() {
  return (
    <AuthProvider>
    <BrowserRouter>
        <ChatProvider>
          <SocialProvider>
            <Routes>
              {/* Auth */}
              <Route path="/" element={<AuthPage />} />
              <Route path="/auth" element={<AuthPage />} />

              {/* Customer Routes */}
              <Route
                path="/home"
                element={
                  <SocialProvider>
                    <CustomerLayout />
                  </SocialProvider>
                }
              />
              <Route
                path="/profile"
                element={
                  <SocialProvider>
                    <ProfilePage />
                  </SocialProvider>
                }
              />
              <Route
                path="/user/:userId"
                element={
                  <SocialProvider>
                    <UserProfilePage />
                  </SocialProvider>
                }
              />

              {/* Admin Routes - Nested */}
              <Route path="/admin" element={<AdminLayout />}>
                {/* Redirect /admin to /admin/dashboard */}
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
            </Routes>
          </SocialProvider>
        </ChatProvider>
    </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
