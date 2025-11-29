import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthPage from "./page/AuthPage/AuthPage";
import CustomerLayout from "./layout/CustomerLayout/CustomerLayout";
import AdminLayout from "./layout/AdminLayout/AdminLayout";
import { UserProvider } from "./context/UserContext";
import "./App.css";
import { ChatProvider } from "./context/ChatContext";

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <ChatProvider>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/home" element={<CustomerLayout />} />

          <Route path="/admin" element={<AdminLayout />}></Route>
        </Routes>
        </ChatProvider>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;
