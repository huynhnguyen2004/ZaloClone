import { useState } from "react";
import { login } from "../api/service/authService";
import { handleApiError } from "../utils/handleApiError";
import { getCurrentUser } from "../api/service/userService";

export default function useAuth({ navigate }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({});

  const handleLogin = async (formData, setFieldError) => {
  try {
    setLoading(true);

    const { data } = await login(formData);
    const token = data?.result?.accessToken;
    sessionStorage.setItem("token", token);
    const user = await getCurrentUser();
   
  
    navigate(user?.role === "Customer" ? "/home" : "/admin");

  } catch (err) {
    handleApiError(err, setStatus, setFieldError);
  } finally {
    setLoading(false);
  }
};

  return {
    loading,
    status,
    setStatus,
    handleLogin,
  };
}