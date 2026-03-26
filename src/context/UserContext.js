import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { resolveCurrentUser } from "./userSession";
import { logout as apiLogout } from "../api/service/authService";

import {
  connectWebSocket,
  disconnectWebSocket,
  sendUserOffline,
  sendUserOfflineBeacon,
} from "../api/websocket";
import { clearAccessToken, getAccessToken } from "../api/tokenStorage";

// =======================
// CONTEXT
// =======================
export const UserContext = createContext();

// =======================
// PROVIDER
// =======================
export const UserProvider = ({ children }) => {
  const navigate = useNavigate();

  // STATE
  const [currentUser, setCurrentUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const wsInitialized = useRef(false);
  let token=getAccessToken();

  // =======================
  // LOAD USER
  // =======================
  useEffect(() => {
    if(!token) navigate("/");
    const loadUser = async () => {
      try {
        const user = await resolveCurrentUser();
        setCurrentUser(user);
      } catch {
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // =======================
  // WEBSOCKET
  // =======================
  useEffect(() => {
    if (!currentUser?.id || wsInitialized.current) return;

    wsInitialized.current = true;

    connectWebSocket({
      userId: currentUser.id,

      // update online/offline
      onPresenceChange: ({ userId, online }) => {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          online ? next.add(userId) : next.delete(userId);
          return next;
        });
      },

      // khi connect thành công
      onConnected: (userId) => {
        setOnlineUsers((prev) => new Set(prev).add(userId));
      },
    });

    // đóng tab → báo offline
    const handleUnload = () => {
      sendUserOfflineBeacon(currentUser.id);
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [currentUser]);

  // =======================
  // LOGOUT
  // =======================
  const logout = async () => {
    if(!token) return;
    if (currentUser?.id) {
      sendUserOffline(currentUser.id);
      await new Promise((r) => setTimeout(r, 100));
    }

    disconnectWebSocket();
    await apiLogout();
    clearAccessToken();
    setCurrentUser(null);
    setOnlineUsers(new Set());
    wsInitialized.current = false;

    navigate("/");
  };

  // =======================
  // CHECK ONLINE
  // =======================
  const isUserOnline = (userId) => onlineUsers.has(userId);

  // =======================
  // PROVIDE
  // =======================
  return (
    <UserContext.Provider
      value={{
        currentUser,
        loading,
        onlineUsers,
        isUserOnline,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};