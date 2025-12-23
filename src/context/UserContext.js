import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

import { useNavigate } from "react-router-dom";

import { getCurrentUser } from "../api/service/userService";
import { logout as apiLogout } from "../api/service/authService";
import { connectWebSocket, disconnectWebSocket, sendUserOffline, sendUserOfflineBeacon, sendUserOnline } from "../api/websocket";
import { getAllFriendSend, getAllFriend } from "../api/service/friend";

const UserContext = createContext();
export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set()); // Lưu trữ danh sách userId online

  const wsInitializedRef = useRef(false);
  const navigate = useNavigate();

  /** Chuẩn hóa request */
  const normalizeRequest = (d) => ({
    id: d.id,
    senderId: d.senderId,
    receiverId: d.receiverId,
    senderName: d.senderName,
    phone: d.phone ?? null,
    createdAt: d.createdAt,
    status: d.status,
    senderAvatarUrl: d.senderAvatarUrl || d.avatar || null,
  });

  /* ============================
        GET CURRENT USER
  ============================ */
  const fetchCurrentUser = useCallback(async () => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    try {
      const res = await getCurrentUser();
      setCurrentUser(res?.result ?? res);
    } catch (err) {
      console.error("Lỗi lấy user:", err);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);


  /* ============================
        FETCH FRIEND LIST
  ============================ */
  const fetchFriends = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const res = await getAllFriend({ id: userId });
      setFriends(res.data.result ?? []);
    } catch (err) {
      console.error("Lỗi fetch bạn bè:", err);
    }
  }, []);

  /* ============================
        FETCH FRIEND REQUEST LIST
  ============================ */
  const fetchFriendRequests = useCallback(async (userId) => {
    if (!userId) return;

    try {
      const res = await getAllFriendSend({ id: userId });
      setFriendRequests(res.data.result ?? []);
    } catch (err) {
      console.error("Lỗi fetch request:", err);
    }
  }, []);

  /* ======================================================
        KHỞI TẠO WEBSOCKET & FETCH FRIENDS + REQUESTS
  ====================================================== */
  useEffect(() => {
    if (!currentUser?.id) return;
    if (wsInitializedRef.current) return; // tránh connect lại

    wsInitializedRef.current = true;

    // Fetch danh sách sau khi login
    fetchFriends(currentUser.id);
    fetchFriendRequests(currentUser.id);

    // Khởi tạo WebSocket
    connectWebSocket({
      userId: currentUser.id,

      onReceiveRequest: (data) => {
        const req = normalizeRequest(data);
        setFriendRequests((prev) =>
          prev.some((x) => x.id === req.id) ? prev : [req, ...prev]
        );
      },

      onReceiveAccept: () => {
        fetchFriends(currentUser.id);
        fetchFriendRequests(currentUser.id);
      },

      // Xử lý thay đổi trạng thái online/offline
      onPresenceChange: (presenceData) => {
        const { userId, online } = presenceData;
        setOnlineUsers((prev) => {
          const newSet = new Set(prev);
          if (online) {
            newSet.add(userId);
          } else {
            newSet.delete(userId);
          }
          return newSet;
        });
      },
    });

    // Xử lý khi user đóng tab/browser
    const handleBeforeUnload = () => {
      if (currentUser?.id) {
        // Sử dụng sendBeacon để đảm bảo gửi được khi đóng tab
        sendUserOfflineBeacon(currentUser.id);
      }
    };

    // Xử lý khi user chuyển tab (visibility change)
    const handleVisibilityChange = () => {
      if (!currentUser?.id) return;
      
      if (document.visibilityState === "hidden") {
        // User rời khỏi tab - có thể đánh dấu idle/away
        console.log("👁️ Tab hidden - user may be away");
      } else if (document.visibilityState === "visible") {
        // User quay lại tab - gửi lại online
        sendUserOnline(currentUser.id);
        console.log("👁️ Tab visible - user is back");
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentUser, fetchFriends, fetchFriendRequests]);


  /* ============================
              LOGOUT
  ============================ */
  const logout = async () => {
    // Gửi offline status trước khi logout và chờ gửi xong
    if (currentUser?.id) {
      sendUserOffline(currentUser.id);
      // Chờ một chút để message được gửi đi trước khi disconnect
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    sessionStorage.removeItem("token");
    disconnectWebSocket();

    await apiLogout(currentUser?.id);

    setCurrentUser(null);
    setFriends([]);
    setFriendRequests([]);
    setOnlineUsers(new Set());

    wsInitializedRef.current = false;

    navigate("/");
  };

  /* ============================
        CHECK IF USER IS ONLINE
  ============================ */
  const isUserOnline = useCallback((userId) => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  /* ============================
              VALUE
  ============================ */
  const value = {
    currentUser,
    friends,
    setFriends,
    friendRequests,
    onlineUsers,

    fetchCurrentUser,
    fetchFriends,
    fetchFriendRequests,

    logout,
    isUserOnline,

    removeFriendRequest: (id) =>
      setFriendRequests((prev) => prev.filter((r) => r.id !== id)),
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
