import { createContext, useEffect, useRef, useState } from "react";
import { clearAccessToken, getAccessToken, setAccessToken } from "../api/tokenStorage";
import { getCurrentUser } from "../api/service/userService";
import { connectWebSocket, disconnectWebSocket, sendUserOffline, sendUserOfflineBeacon } from "../api/websocket";
import { refresh } from "../api/service/refreshTokenService";
import { logout } from "../api/service/authService";

export const AuthContext=createContext();
export const AuthProvider=({children})=>{
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuth,setIsAuth]=useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const didRun=useRef();
  const wsInitialized = useRef(false);
  const token=getAccessToken();
  useEffect(() => {
    if(didRun.current) return;
    didRun.current=true;
    const loadUser = async () => {
      try {
        const res = await refresh();
        const token=res.data.result.accessToken;
        setAccessToken(token);
        const user=await getCurrentUser();
        
        
        setCurrentUser(user);
        
        
        setIsAuth(true);
      } catch(err) {
        setCurrentUser(null);
        setIsAuth(false);
         
    }
       finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);
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
    if (!token) return;
    if (currentUser?.id) {
      sendUserOffline(currentUser.id);
      await new Promise((r) => setTimeout(r, 100));
    }

    disconnectWebSocket();
    await logout();
    
    clearAccessToken();
    setCurrentUser(null);
    setOnlineUsers(new Set());
    wsInitialized.current = false;

    window.location.href="/";
  };

  // =======================
  // CHECK ONLINE
  // =======================
  const isUserOnline = (userId) => onlineUsers.has(userId);

  // =======================
  // PROVIDE
  // =======================
  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuth,
        loading,
        onlineUsers,
        isUserOnline,
        logout
        
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


