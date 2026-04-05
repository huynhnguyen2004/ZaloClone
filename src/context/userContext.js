import { createContext, useCallback, useEffect, useRef, useState } from "react";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "../api/tokenStorage";
import { getCurrentUser } from "../api/service/userService";
import {
  connectWebSocket,
  disconnectWebSocket,
  sendUserOffline, 
} from "../api/websocket";
import { refresh } from "../api/service/refreshTokenService";
import { handleLogout } from "../api/service/authService";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const didRun = useRef(false);
  const wsInitialized = useRef(false);

  // =======================
  // LOAD USER
  // =======================
  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const loadUser = async () => {
      try {
        const res = await refresh();
        const token = res.data.result.accessToken;
        setAccessToken(token);

        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (err) {
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // =======================
  // FETCH USER
  // =======================
  const fetchCurrentUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setCurrentUser(null);
      return null;
    }

    const user = await getCurrentUser();
    setCurrentUser(user);
    return user;
  }, []);

  // =======================
  // CONNECT WEBSOCKET
  // =======================
  useEffect(() => {
    if (!currentUser?.id) return;

   
    if (wsInitialized.current) return;
    wsInitialized.current = true;

    connectWebSocket({
      userId: currentUser.id,

      
      onPresenceChange: (data) => {
       
      
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          data?.online ? next.add(data?.userId) : next.delete(data?.userId);
          return next;
        });
      },

      
     
    });

  

    return () => {
      disconnectWebSocket();
      wsInitialized.current = false;
    };
  }, [currentUser]);

  // =======================
  // LOGOUT
  // =======================
  const logout = async () => {
    const token = getAccessToken();
    if (!token) return;

    try {
    
      if (currentUser?.id) {
        sendUserOffline(currentUser.id);

        // chờ gửi xong
        await new Promise((r) => setTimeout(r, 100));
      }

      disconnectWebSocket();

      await handleLogout();
    } catch (err) {
      console.error(err);
    } finally {
      clearAccessToken();
      setCurrentUser(null);
      setOnlineUsers(new Set());
      wsInitialized.current = false;

      window.location.href = "/";
    }
  };

  // =======================
  // CHECK ONLINE
  // =======================
  const isUserOnline = (userId) => onlineUsers.has(userId);

  // =======================
  // PROVIDER
  // =======================
  return (
    <UserContext.Provider
      value={{
        currentUser,
        loading,
        fetchCurrentUser,
        onlineUsers,
        isUserOnline,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};