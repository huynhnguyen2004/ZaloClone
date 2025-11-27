import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthPage from "./page/AuthPage/AuthPage";
import CustomerLayout from "./layout/CustomerLayout/CustomerLayout";
import AdminLayout from "./layout/AdminLayout/AdminLayout";
import { UserProvider } from "./context/UserContext";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/home" element={<CustomerLayout />} />

          <Route path="/admin" element={<AdminLayout />}></Route>
        </Routes>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;
