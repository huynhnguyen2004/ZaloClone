import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { connectWebSocket, sendUserOfflineBeacon, sendUserOnline } from "../api/websocket";
import { getAllFriend, getAllFriendSend } from "../api/service/friend";
import { normalizeFriendRequest } from "./userPresence";
import { useUser } from "../hooks/useUser";

const SocialContext = createContext();

export const useSocial = () => useContext(SocialContext);

export const SocialProvider = ({ children }) => {
  const { currentUser } = useUser();
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const wsInitializedRef = useRef(false);

  const fetchFriends = useCallback(async (userId) => {
    if (!userId) return;

    try {
      const res = await getAllFriend({ id: userId });
      setFriends(res.data.result ?? []);
    } catch (err) {
      console.error("Lỗi fetch bạn bè:", err);
    }
  }, []);

  const fetchFriendRequests = useCallback(async (userId) => {
    if (!userId) return;

    try {
      const res = await getAllFriendSend({ id: userId });
      setFriendRequests(res.data.result ?? []);
    } catch (err) {
      console.error("Lỗi fetch request:", err);
    }
  }, []);

  useEffect(() => {
    if (!currentUser?.id) {
      wsInitializedRef.current = false;
      setFriends([]);
      setFriendRequests([]);
      setOnlineUsers(new Set());
      return;
    }

    if (wsInitializedRef.current) return;

    wsInitializedRef.current = true;
    fetchFriends(currentUser.id);
    fetchFriendRequests(currentUser.id);

    connectWebSocket({
      userId: currentUser.id,
      onReceiveRequest: (data) => {
        const request = normalizeFriendRequest(data);
        setFriendRequests((prev) =>
          prev.some((item) => item.id === request.id) ? prev : [request, ...prev]
        );
      },
      onReceiveAccept: () => {
        fetchFriends(currentUser.id);
        fetchFriendRequests(currentUser.id);
      },
      onPresenceChange: (presenceData) => {
        const { userId, online } = presenceData;
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          if (online) {
            next.add(userId);
          } else {
            next.delete(userId);
          }
          return next;
        });
      },
      onConnected: (userId) => {
        setOnlineUsers((prev) => new Set(prev).add(userId));
      },
    });

    const handleBeforeUnload = () => {
      if (currentUser?.id) {
        sendUserOfflineBeacon(currentUser.id);
      }
    };

    const handleVisibilityChange = () => {
      if (!currentUser?.id) return;

      if (document.visibilityState === "visible") {
        sendUserOnline(currentUser.id);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentUser?.id, fetchFriends, fetchFriendRequests]);

  const isUserOnline = useCallback(
    (userId) => {
      return onlineUsers.has(userId);
    },
    [onlineUsers]
  );

  const removeFriendRequest = useCallback((id) => {
    setFriendRequests((prev) => prev.filter((request) => request.id !== id));
  }, []);

  return (
    <SocialContext.Provider
      value={{
        friends,
        setFriends,
        friendRequests,
        onlineUsers,
        fetchFriends,
        fetchFriendRequests,
        isUserOnline,
        removeFriendRequest,
      }}
    >
      {children}
    </SocialContext.Provider>
  );
};
