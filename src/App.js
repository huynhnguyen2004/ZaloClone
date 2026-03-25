import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthPage from "./page/AuthPage/AuthPage";
import "./App.css";
import { UserProvider } from "./context/userContext";

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth */}
          <Route path="/" element={<AuthPage />} />
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
