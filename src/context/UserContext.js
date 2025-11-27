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

  /* ======================================
        FETCH CURRENT USER
  ====================================== */
  const fetchCurrentUser = useCallback(async () => {
    const token = sessionStorage.getItem("token");
    if (!token) return; // không login → không gọi API

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

  /* ======================================
        FETCH FRIEND LIST
  ====================================== */
  const fetchFriends = useCallback(async (userId) => {
    if (!userId) return;

    try {
      const res = await getAllFriend({ id: userId });
      setFriends(res.data.result ?? []);
    } catch (err) {
      console.error("Lỗi fetch bạn bè:", err);
    }
  }, []);

  /* ======================================
        FETCH FRIEND REQUEST LIST
  ====================================== */
  const fetchFriendRequests = useCallback(async (userId) => {
    if (!userId) return;

    try {
      const res = await getAllFriendSend({ id: userId });
      setFriendRequests(res.data.result ?? []);
    } catch (err) {
      console.error("Lỗi fetch request:", err);
    }
  }, []);

  /* ======================================
        Khi có user → tải dữ liệu
  ====================================== */
  useEffect(() => {
    if (!currentUser?.id) return;

    fetchFriends(currentUser.id);
    fetchFriendRequests(currentUser.id);
  }, [currentUser, fetchFriends, fetchFriendRequests]);

  /* ======================================
        WebSocket
  ====================================== */
  useEffect(() => {
    if (!currentUser?.id) return;

    if (wsInitializedRef.current) return;
    wsInitializedRef.current = true;

    connectWebSocket(
      currentUser.id,

      // realtime khi có lời mời kết bạn
      (data) => {
        const req = normalizeRequest(data);

        setFriendRequests((prev) =>
          prev.some((x) => x.id === req.id) ? prev : [req, ...prev]
        );
      },

      // realtime khi lời mời được chấp nhận
      () => {
        fetchFriends(currentUser.id);
        fetchFriendRequests(currentUser.id);
      }
    );
  }, [currentUser, fetchFriends, fetchFriendRequests]);

  /* ======================================
        LOGOUT
  ====================================== */
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

  /* ======================================
        VALUE TRẢ RA CHO TOÀN APP
  ====================================== */
  const value = {
    currentUser,
    friends,
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
