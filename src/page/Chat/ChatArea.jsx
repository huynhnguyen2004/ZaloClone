import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  acceptFriend,
  rejectFriendRequest
} from "../../api/service/friend";

import { sendSocketData } from "../../api/websocket";

import "./ChatArea.css";
import { useChat } from "../../context/chatContext";
import { UserContext } from "../../context/userContext";
import ChatsTabContent from "../../component/Tabs/ChatsTabContent";
import ContactsTabContent from "../../component/Tabs/ContactsTabContent";
import FriendRequestTabContent from "../../component/Tabs/FriendRequestTabContent";
import DefaultTabContent from "../../component/Tabs/DefaultTabContent";
import { useFriend, useSocial } from "../../context/friendContext";


function ChatArea({ activeTab }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // 🔥 Dữ liệu realtime lấy từ UserContext
  const { currentUser } = useContext(UserContext);
  const { friendRequests, removeFriendRequest } = useFriend();
  const {activeChat,setActiveChat}=useChat();

  useEffect(() => {
    // Khi đổi tab → tắt chat
    setActiveChat(null);
}, [activeTab]);
  /** Format thời gian */
  const formatRequestTime = (value) => {
    if (!value) return "Vừa gửi";
    const date = new Date(value);
    if (isNaN(date.getTime())) return "Vừa gửi";

    return date.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    });
  };

  /** Bấm Chấp nhận */
  const handleAccept = async (req) => {
    try {
      // API cần meId (người nhận) và otherId (người gửi - senderId)
      const senderId = req.senderId || req.id;
      const res = await acceptFriend({userId:senderId});

      const payload = res || {
        id: req.id,
        senderId: senderId,
        receiverId: currentUser.id,
      };

      try {
        sendSocketData("/app/friend/accept", payload);
      } catch (e) {
        console.warn("WebSocket error", e);
      }

      removeFriendRequest(req.id);
    } catch (err) {
      console.error("Accept error:", err);
    }
  };

  /** Bấm Từ chối */
  const handleDecline = async (req) => {
    try {
      // API cần meId (người nhận) và userId (người gửi - senderId)
      const senderId = req.senderId || req.id;
      await rejectFriendRequest({userId:senderId});
      removeFriendRequest(req.id);
    } catch (err) {
      console.error("Decline error:", err);
    }
  };

  // -------------------------------------------------------------------
  // ---------------------- RENDER UI THEO TAB -------------------------
  // -------------------------------------------------------------------
  const renderContent = () => {
    switch (activeTab) {
      case "chats":
        return (
          <ChatsTabContent
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        );

      case "contacts":
        return (
          <ContactsTabContent
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        );

      case "friendRequests":
        return (
          <FriendRequestTabContent
            friendRequests={friendRequests}
            handleAccept={handleAccept}
            handleDecline={handleDecline}
            formatRequestTime={formatRequestTime}
            onAvatarClick={(userId) => navigate(`/user/${userId}`)}
          />
        );

      default:
        return <DefaultTabContent />;
    }
  };

  return <div className="chat-area">{renderContent()}</div>;
}

export default ChatArea;
