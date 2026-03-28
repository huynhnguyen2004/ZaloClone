import { useContext, useState } from "react";
import { login } from "../api/service/authService";
import { handleApiError } from "../utils/handleApiError";
import { setAccessToken } from "../api/tokenStorage";
import { UserContext } from "../context/userContext";

export default function useAuth({ navigate }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({});
  const { fetchCurrentUser } = useContext(UserContext);
  const [showCaptcha, setShowCaptcha] = useState(false);

  const handleLogin = async (formData, setFieldError) => {
    try {
      setLoading(true);

      const payload = { ...formData };
      if (!payload.captchaToken) {
        delete payload.captchaToken;
      }

      const { data } = await login(payload);
      const token = data?.result?.accessToken;
      setAccessToken(token);
      const user = await fetchCurrentUser();

      navigate(user?.role === "Customer" ? "/home" : "/admin");
    } catch (err) {
      const code = err?.response?.data?.code;
      if (code === "CAPTCHA_REQUIRED") {
        setShowCaptcha(true);
      }

      handleApiError(err, setStatus, setFieldError);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    showCaptcha,
    status,
    setStatus,
    handleLogin,
  };
}
