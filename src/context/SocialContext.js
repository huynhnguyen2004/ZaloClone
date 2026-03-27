import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { connectWebSocket, sendUserOnline } from "../api/websocket";
import { getAllFriend, getAllFriendSend } from "../api/service/friend";
import { normalizeFriendRequest } from "./userPresence";
import { UserContext } from "./userContext";

const SocialContext = createContext();

export const useSocial = () => useContext(SocialContext);

export const SocialProvider = ({ children }) => {
  const { currentUser } = useContext(UserContext);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
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
      
    });

  

    const handleVisibilityChange = () => {
      if (!currentUser?.id) return;

      if (document.visibilityState === "visible") {
        sendUserOnline(currentUser.id);
      }
    };

   
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
     
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentUser?.id, fetchFriends, fetchFriendRequests]);

 

  const removeFriendRequest = useCallback((id) => {
    setFriendRequests((prev) => prev.filter((request) => request.id !== id));
  }, []);

  return (
    <SocialContext.Provider
      value={{
        friends,
        setFriends,
        friendRequests,
        fetchFriends,
        fetchFriendRequests,
        removeFriendRequest,
      }}
    >
      {children}
    </SocialContext.Provider>
  );
};
