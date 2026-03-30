import { createContext, useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "./userContext";
import { connectWebSocket, disconnectWebSocket } from "../api/websocket";
import { useFriend } from "./friendContext";
export const NotificationContext = createContext();
export const useNoti = () => useContext(NotificationContext);
export const NotificationProvider = ({ children }) => {
  const { currentUser } = useContext(UserContext);
  const { setFriendRequests } = useFriend();
  const [notifications, setNotifications] = useState([]);
  const wsInitialized = useRef(false);
  const getNotificationMessage = (noti) => {
    switch (noti.type) {
      case "SEND_REQUEST":
        return `${noti.sender.name} đã gửi lời mời kết bạn`;

      case "ACCEPT_REQUEST":
        return `${noti.sender.name} đã chấp nhận lời mời`;

      case "NEW_MESSAGE":
        return `${noti.sender.name} đã gửi tin nhắn`;

      default:
        return "Bạn có thông báo mới";
    }
  };

  useEffect(() => {
    if (!currentUser?.id) return;

    if (wsInitialized.current) return;
    wsInitialized.current = true;

    connectWebSocket({
      userId: currentUser.id,
      onReceiveNotification: (data) => {
        if (data.type === "SEND_REQUEST") {
          const resNoti = {
            id: data?.targetId,
            senderId: data?.senderId,
            senderFirstName: data?.senderFirstName,
            senderLastName: data?.senderLastName,
            targetId:data?.targetId,
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
    <NotificationContext.Provider value={{ notifications }}>
      {children}
    </NotificationContext.Provider>
  );
};
