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
import { connectWebSocket, disconnectWebSocket } from "../api/websocket";
import { getAllFriendSend, getAllFriend } from "../api/service/friend";

const UserContext = createContext();
export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);

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

    
    });

  }, [currentUser, fetchFriends, fetchFriendRequests]);


  /* ============================
              LOGOUT
  ============================ */
  const logout = async () => {
    sessionStorage.removeItem("token");
    disconnectWebSocket();

    await apiLogout(currentUser?.id);

    setCurrentUser(null);
    setFriends([]);
    setFriendRequests([]);

    wsInitializedRef.current = false;

    navigate("/");
  };

  /* ============================
              VALUE
  ============================ */
  const value = {
    currentUser,
    friends,
    setFriends,
    friendRequests,

    fetchCurrentUser,
    fetchFriends,
    fetchFriendRequests,

    logout,

    removeFriendRequest: (id) =>
      setFriendRequests((prev) => prev.filter((r) => r.id !== id)),
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
