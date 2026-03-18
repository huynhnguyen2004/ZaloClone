import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout as apiLogout } from "../api/service/authService";
import { disconnectWebSocket, sendUserOffline } from "../api/websocket";
import { clearAccessToken } from "../api/tokenStorage";
import { resolveCurrentUser } from "./userSession";

const AuthContext = createContext();

export const useUser = () => useContext(AuthContext);

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchCurrentUser = useCallback(async () => {
    try {
      setError("");
      const user = await resolveCurrentUser();
      setCurrentUser(user);
      return user;
    } catch (err) {
      setError("Không thể tải thông tin người dùng");
      setCurrentUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      const user = await fetchCurrentUser();
      if (!isMounted) return;

      if (!user) {
        setCurrentUser(null);
      }

      setLoading(false);
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [fetchCurrentUser]);

  const logout = async () => {
    if (currentUser?.id) {
      sendUserOffline(currentUser.id);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    clearAccessToken();
    disconnectWebSocket();

    try {
      await apiLogout();
    } catch (err) {
      console.warn("Logout API error:", err);
    }

    setCurrentUser(null);
    navigate("/");
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        error,
        fetchCurrentUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
