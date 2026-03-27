import { useContext, useState } from "react";
import { login } from "../api/service/authService";
import { handleApiError } from "../utils/handleApiError";
import { setAccessToken } from "../api/tokenStorage";
import { UserContext } from "../context/userContext";


export default function useAuth({ navigate }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({});
  const {fetchCurrentUser}=useContext(UserContext)

  const handleLogin = async (formData, setFieldError) => {
  try {
    setLoading(true);

    const { data } = await login(formData);
    const token = data?.result?.accessToken;
    setAccessToken(token);
    const user = await fetchCurrentUser();
   
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