import { useState } from "react";
import { login } from "../api/service/authService";
import { handleApiError } from "../utils/handleApiError";

export default function useAuth({ navigate, fetchCurrentUser }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({});

  const handleLogin = async (formData, setFieldError) => {
  try {
    setLoading(true);

    const { data } = await login(formData);
    const token = data?.result?.accessToken;
    sessionStorage.setItem("token", token);
    const user = await fetchCurrentUser();
   
    
    navigate(user?.role === "Customer" ? "/home" : "/admin");

  } catch (err) {
    console.error(err);
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