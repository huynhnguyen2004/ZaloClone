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
  const [lastIdFriend, setLastIdFriend] = useState(null);
  const [lastName, setLastName] = useState(null);

  const fetchFriends = useCallback(async (isLoadMore = false) => {
    
    try {
      const res = await getAllFriend({
        size: 5,
        ...(lastName && { lastName }),
        ...(lastId && { lastId }),
      });
      const data = res.data.result ?? [];
      if(!isLoadMore){
        setLastIdFriend(null);
        setLastName(null);
      }
      if(isLoadMore){
        setFriends((prev)=>[...prev,...data]);
      }else{
        setFriends(data);
      }
      if(data.length>0&&isLoadMore){
        setLastIdFriend(data[data.length-1].id);
        setLastName(data[data.length-1].lastName);
      }
    } catch (err) {
      console.error("Lỗi fetch bạn bè:", err);
    }
  }, [lastName,lastId]);
  const fetchFriendRequests = useCallback(
    async (isLoadMore = false) => {
      try {
        const res = await getAllFriendRequest({
          size: 5,
          ...(lastId && { lastId }),
        });
        const data = res?.data?.result || [];
        if (!isLoadMore) {
          setLastId(null);
        }
        if (isLoadMore) {
          setFriendRequests((prev) => [...prev, ...data]);
        } else {
          setFriendRequests(data);
        }
        if (data.length > 0&&isLoadMore) {
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
    const handleScrollFriend = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;

    if (scrollTop + clientHeight >= scrollHeight - 50) {
      fetchFriends(true);
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
      userId: currentUser?.id,
      onFriendList: (data) => {
        const res = {
          friendId: data?.friendId,
          friendName: data?.friendName,
          online: data?.online,
          phone: data?.phone,
          avatarUrl: data?.avatarUrl,
        };
        setFriends((prev) => {
          const filter = prev.filter((item) => item.friendId !== res.friendId);
          return [res, ...filter];
        });
      },
      onUpdateRequestList: (data) => {
        setFriendRequests((prev) => {
          const filter = prev.filter(
            (item) => item?.senderId !== data?.senderId,
          );
          return filter;
        });
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

  return (
    <FriendContext.Provider
      value={{
        friends,
        setFriends,
        friendRequests,
        setFriendRequests,
        handleScroll,
        handleScrollFriend,
        fetchFriends,
        fetchFriendRequests,
      }}
    >
      {children}
    </FriendContext.Provider>
  );
};
