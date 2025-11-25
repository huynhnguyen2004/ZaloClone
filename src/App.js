import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthPage from "./page/AuthPage";
import CustomerLayout from "./layout/CustomerLayout/CustomerLayout";
import AdminLayout from "./layout/AdminLayout/AdminLayout";


function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Layout khách hàng */}
        <Route path="/home" element={<CustomerLayout />}>
          {/* Trang login đặt ở layout Customer */}
         
        </Route>

        {/* Layout admin */}
        <Route path="/admin" element={<AdminLayout />}>
          {/* ví dụ route con của admin */}
          {/* <Route path="dashboard" element={<Dashboard />} /> */}
        </Route>
        <Route path="/" element={<AuthPage />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
