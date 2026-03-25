import { useState } from "react";
import { login, register } from "../api/service/authService";
import { handleApiError } from "../utils/handleApiError";

export default function useAuth({ navigate, fetchCurrentUser }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({});

  const handleLogin = async (formData, setFieldError) => {
    try {
      setLoading(true);

      const { data } = await login(formData);
      const token = data?.result?.accessToken;

      if (token) {
        sessionStorage.setItem("token", token);

        const user = await fetchCurrentUser();
        if (user) {
          navigate(user.role === "Customer" ? "/home" : "/admin");
        }
      }
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