import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  acceptFriend,
  rejectFriendRequest
} from "../../api/service/friend";

import "./ChatArea.css";
import { useChat } from "../../context/ChatContext";
import { UserContext } from "../../context/userContext";
import ChatsTabContent from "../../component/Tabs/ChatsTabContent";
import ContactsTabContent from "../../component/Tabs/ContactsTabContent";
import FriendRequestTabContent from "../../component/Tabs/FriendRequestTabContent";
import DefaultTabContent from "../../component/Tabs/DefaultTabContent";
import { useFriend } from "../../context/friendContext";
import NotificationsTab from "../../component/Tabs/NotificationsTab";


function ChatArea({ activeTab }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");


  const { currentUser } = useContext(UserContext);
  const { friendRequests, setFriendRequests, handleScrollFriend } = useFriend();
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
      
      const senderId = req.senderId ;
     await acceptFriend({userId:senderId});

      
    } catch (err) {
      console.error("Accept error:", err);
    }
  };

  /** Bấm Từ chối */
  const handleDecline = async (req) => {
    try {
      const senderId = req.senderId;
      await rejectFriendRequest({userId:senderId});
      setFriendRequests((prev)=>{
        const filter=prev.filter((item)=>item.senderId!==senderId);
        return filter;
      })
      
    } catch (err) {
      console.error("Decline error:", err);
    }
  };

  const handleProfile=(item)=>{
    navigate(`/user/${item?.senderId}`)
    
    
  }
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
            handleScrollFriend={handleScrollFriend}
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
      case "notifications":
        return (
          <NotificationsTab  handleProfile={handleProfile}/>
           
         
        )
      default:
        return <DefaultTabContent />;
    }
  };

  return <div className="chat-area">{renderContent()}</div>;
}

export default ChatArea;
