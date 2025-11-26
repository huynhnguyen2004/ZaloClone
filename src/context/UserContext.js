import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
} from "react";

import { getCurrentUser } from "../api/service/userService";
import { logout as logoutApi } from "../api/service/authService";
import { useNavigate } from "react-router-dom";
import { connectWebSocket, disconnectWebSocket } from "../api/websocket";

const UserContext = createContext();

export const useUser = () => {
    const ctx = useContext(UserContext);
    if (!ctx) throw new Error("useUser must be used within UserProvider");
    return ctx;
};

export const UserProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [friendRequests, setFriendRequests] = useState([]);
    const [error, setError] = useState(null);

    const connectedUserIdRef = useRef(null);
    const wsInitializedRef = useRef(false); // chặn reconnect strict mode
    const navigate = useNavigate();

    const normalizeRequest = (data) => ({
        id: data.id ,
        senderId: data.senderId,
        receiverId: data.receiverId,
        senderName: data.senderName,
        receiverName: data.receiverName,
        createdAt: data.createdAt,
        status: data.status,
        // fallback fields for display
        phone: data.phone ?? null,
        senderAvatarUrl: data.senderAvatarUrl || data.avatarUrl || data.avatar,
        raw: data,
    });

    // =============================================
    // FETCH USER 1 LẦN
    // =============================================
    const fetchCurrentUser = useCallback(async () => {
        try {
            setLoading(true);

            const token = sessionStorage.getItem("token");
            if (!token) {
                setCurrentUser(null);
                setLoading(false);
                return;
            }

            const res = await getCurrentUser();
            console.log("🔎 fetchCurrentUser response:", res);

            const payload = res?.result ?? res;
            const normalizedUser = {
                ...payload,
                id:
                    payload?.id ??
                    payload?.userId ??
                    payload?.user?.id ??
                    payload?.phone ??
                    null,
            };

            setCurrentUser(normalizedUser);
            console.log("✅ currentUser set:", normalizedUser);
        } catch (err) {
            console.error("fetchCurrentUser error:", err);
            setCurrentUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    // Run 1 lần khi app chạy
    useEffect(() => {
        fetchCurrentUser();
    }, []);

    // =============================================
    // WEBSOCKET EFFECT — KHÔNG RECONNECT NHIỀU LẦN
    // =============================================
    useEffect(() => {
        if (!currentUser?.id) {
            // user vừa logout hoặc chưa có -> đảm bảo socket đóng lại
            if (wsInitializedRef.current) {
                disconnectWebSocket();
                wsInitializedRef.current = false;
                connectedUserIdRef.current = null;
            }
            return;
        }

        // tránh connect trùng user do StrictMode double invoke
        if (
            wsInitializedRef.current &&
            connectedUserIdRef.current === currentUser.id
        ) {
            return;
        }

        console.log("🔌 Connecting WebSocket for user", currentUser.id);

        const handleReceiveRequest = (raw) => {
            const req = normalizeRequest(raw);
            console.log("📩 WS Friend Request:", req);
            setFriendRequests((prev) =>
                prev.some((x) => x.id === req.id) ? prev : [req, ...prev]
            );
        };

        const handleReceiveAccept = (data) => {
            console.log("🎉 Friend accepted:", data);
        };

        wsInitializedRef.current = true;
        connectedUserIdRef.current = currentUser.id;
        connectWebSocket(currentUser.id, handleReceiveRequest, handleReceiveAccept);

        return () => {
            disconnectWebSocket();
            wsInitializedRef.current = false;
            connectedUserIdRef.current = null;
        };
    }, [currentUser?.id]);


    // =============================================
    // LOGOUT
    // =============================================
    const logout = async () => {
        try {
            if (currentUser?.id) await logoutApi(currentUser.id);
        } catch (err) {
            console.error("Logout API error:", err);
        }

        sessionStorage.removeItem("token");
        setCurrentUser(null);
        setFriendRequests([]);

        // Ngắt WebSocket
        disconnectWebSocket();
        connectedUserIdRef.current = null;
        wsInitializedRef.current = false;

        navigate("/");
    };

    const value = {
        currentUser,
        loading,
        error,
        friendRequests,
        fetchCurrentUser,
        logout,
        removeFriendRequest: (reqId) =>
            setFriendRequests((prev) => prev.filter((r) => r.id !== reqId)),
        clearFriendRequests: () => setFriendRequests([]),
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};

export default UserContext;
