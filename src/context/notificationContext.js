import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { UserContext } from "./userContext";
import { connectWebSocket, disconnectWebSocket } from "../api/websocket";
import { useFriend } from "./friendContext";
import { getAllNotification } from "../api/service/notification";
export const NotificationContext = createContext();
export const useNoti = () => useContext(NotificationContext);
export const NotificationProvider = ({ children }) => {
  const { currentUser } = useContext(UserContext);
  const { setFriendRequests } = useFriend();
  const [notifications, setNotifications] = useState([]);
  const wsInitialized = useRef(false);
  const [lastId, setLastId] = useState(null);
  

  const fetchNotification = useCallback(
    async (isLoadMore = false) => {
      try {
        const res = await getAllNotification({
          size: 10,
          ...(lastId && { lastId }),
        });
        const data = res?.data?.result?.content || [];
      
        
        if (!isLoadMore) {
          setLastId(null);
        }
        if (isLoadMore) {
          setNotifications((pre) => [...data, ...pre]);
        } else {
          setNotifications(data);
        }
        if (data.length > 0) {
          setLastId(data[data.length - 1].id);
        }
      } catch (error) {
        console.log(error);
        
      }
    },
    [lastId],
  );
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;

    if (scrollTop + clientHeight >= scrollHeight - 50) {
      fetchNotification(true);
    }
  };

  useEffect(() => {
    if (!currentUser?.id) return;

    if (wsInitialized.current) return;
    wsInitialized.current = true;
    fetchNotification();
    connectWebSocket({
      userId: currentUser.id,
      onReceiveNotification: (data) => {
        if (data.type === "SEND_REQUEST") {
          const resNoti = {
            id: data?.targetId,
            senderId: data?.senderId,
            senderFirstName: data?.senderFirstName,
            senderLastName: data?.senderLastName,
            targetId: data?.targetId,
            isRead:data?.isRead,
            type: data?.type,
          };
          const res = {
            id: data?.targetId,
            senderId: data?.senderId,
            senderName: data?.senderFirstName,
            phone: data?.senderPhone,
          };

          setFriendRequests((prev) => {
            const exists = prev.some((item) => item.id === data.targetId);
            if (exists) return prev;

            return [res, ...prev];
          });
          setNotifications((prev) => [resNoti, ...prev]);
        }
      },
    });

    return () => {
      disconnectWebSocket();
      wsInitialized.current = false;
    };
  }, [currentUser]);
  return (
    <NotificationContext.Provider value={{ notifications,setNotifications,handleScroll }}>
      {children}
    </NotificationContext.Provider>
  );
};
