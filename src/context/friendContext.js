import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { connectWebSocket, sendUserOnline } from "../api/websocket";
import { getAllFriend, getAllFriendRequest } from "../api/service/friend";
import { UserContext } from "./userContext";


const FriendContext = createContext();

export const useFriend = () => useContext(FriendContext);

export const FriendProvider = ({ children }) => {
  const { currentUser } = useContext(UserContext);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const wsInitializedRef = useRef(false);
  const [lastId, setLastId] = useState(null);

  const fetchFriends = useCallback(async (userId) => {
    if (!userId) return;

    try {
      const res = await getAllFriend({ id: userId });
      setFriends(res.data.result ?? []);
    } catch (err) {
      console.error("Lỗi fetch bạn bè:", err);
    }
  }, []);
  const fetchFriendRequests = useCallback(
    async (isLoadMore = false) => {
      try {
        const res = await getAllFriendRequest({
          size: 5,
          ...(lastId && { lastId }),
        });
        const data = res?.data?.result?.content || [];
        if (!isLoadMore) {
          setLastId(null);
        }
        if (isLoadMore) {
          setFriendRequests((pre) => [...data,...pre]);
        } else {
          setFriendRequests(data);
        }
        if (data.length > 0) {
          setLastId(data[data.length - 1].id);
        }
      } catch (err) {
        console.error("Lỗi fetch request:", err);
      }
    },
    [lastId],
  );
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;

    if (scrollTop + clientHeight >= scrollHeight - 50) {
      fetchFriendRequests(true);
    }
  };

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
    fetchFriendRequests();
    connectWebSocket({
      userId:currentUser?.id,
      onFriendList:(data)=>{
        const res={
          friendId:data?.friendId,
          friendName:data?.friendName,
          online:data?.online,
          phone:data?.phone,
          avatarUrl:data?.avatarUrl
        };
        setFriends((prev)=>{
          const filter=prev.filter(item=>item.friendId!==res.friendId);
          return [res,...filter];
        })
        
      }
    })
   

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
    <FriendContext.Provider
      value={{
        friends,
        setFriends,
        friendRequests,
        setFriendRequests,
        handleScroll,
        fetchFriends,
        fetchFriendRequests,
        removeFriendRequest,
      }}
    >
      {children}
    </FriendContext.Provider>
  );
};
