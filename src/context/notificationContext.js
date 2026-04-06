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
        const data = res?.data?.result || [];

        if (!isLoadMore) {
          setLastId(null);
        }
        if (isLoadMore) {
          setNotifications((prev) => [...prev, ...data]);
        } else {
          setNotifications(data);
        }
        if (data.length > 0&&isLoadMore) {
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
            id: data?.id,
            senderId: data?.senderId,
            senderFirstName: data?.senderFirstName,
            senderLastName: data?.senderLastName,
            targetId: data?.targetId,
            isRead: data?.isRead,
            type: data?.type,
          };
          const resRequest = {
            id: data?.targetId,
            senderId: data?.senderId,
            senderName: data?.senderFirstName,
            phone: data?.senderPhone,
          };

          setFriendRequests((prev) => {
            const exists = prev.some((item) => item.id === resRequest.id);
            if (exists) return prev;

            return [resRequest, ...prev];
          });
          setNotifications((prev) => {
            const filtered = prev.filter(
              (item) =>
                !(
                  item.senderId === resNoti.senderId &&
                  item.type === resNoti.type
                ),
            );

            return [resNoti, ...filtered];
          });
        }
        if (data.type === "ACCEPT_REQUEST") {
          const resNoti = {
            id: data?.id,
            senderId: data?.senderId,
            senderFirstName: data?.senderFirstName,
            senderLastName: data?.senderLastName,
            targetId: data?.targetId,
            isRead: data?.isRead,
            type: data?.type,
          };
          const resRequest = {
            id: data?.targetId,
            senderId: data?.receiverId,
            senderName: data?.receiverFirstName,
            phone: data?.receiverPhone,
          };

          setNotifications((prev) => {
            if(resNoti?.senderId===currentUser?.id) return prev;

            const filter = prev.filter(
              (item) =>
                !(
                  item.senderId === resNoti.senderId &&
                  item.type === resNoti.type
                ),
            );
            return [resNoti, ...filter];
          });
          setFriendRequests((prev) => {
            return prev.filter((item) => item.senderId !== resRequest.senderId);
          });
        }
      },
    });

    return () => {
      disconnectWebSocket();
      wsInitialized.current = false;
    };
  }, [currentUser]);
  return (
    <NotificationContext.Provider
      value={{ notifications, setNotifications, handleScroll }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
