import React, { useEffect, useState } from "react";
import "./ConversationList.css";
import { useUser } from "../../context/UserContext";
import { useChat } from "../../context/ChatContext";
import { getMyConversations } from "../../api/service/conversation";

export default function ConversationList() {
  const { currentUser } = useUser();
  const { openChat, activeChat, messages } = useChat();
  const [conversations, setConversations] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true); // Chỉ loading lần đầu

  // 🔥 Load danh sách hội thoại lần đầu
  useEffect(() => {
    const fetchConversations = async () => {
      if (!currentUser?.id) return;

      try {
        const data = await getMyConversations(currentUser.id);
        setConversations(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setInitialLoading(false); // Chỉ tắt loading lần đầu
      }
    };

    fetchConversations();
  }, [currentUser?.id, messages]);

  // 🔥 Truncate tin nhắn cuối
  const formatTime = (dateStr) => {
    if (!dateStr) return "";

    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Trong vòng 1 phút
    if (diffMins < 1) return "Vừa xong";

    // Trong vòng 1 giờ
    if (diffMins < 60) return `${diffMins} phút`;

    // Trong ngày hôm nay
    if (diffDays === 0) {
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // Hôm qua
    if (diffDays === 1) return "Hôm qua";

    // Trong tuần
    if (diffDays < 7) {
      const days = ["CN", "Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7"];
      return days[date.getDay()];
    }

    // Lâu hơn
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  // 🔥 Truncate tin nhắn cuối
  const truncateMessage = (msg, maxLength = 35) => {
    if (!msg) return "Chưa có tin nhắn mới";
    return msg.length > maxLength ? msg.substring(0, maxLength) + "..." : msg;
  };

  // 🔥 Click vào conversation
  const handleClick = (conv) => {
    const friendData = {
      friendId: conv.friendId,
      friendName: conv.friendName || "Unknown",
      avatarUrl: conv.friendAvatar,
      online: conv.online,
      lastReadMessageContent:conv.lastReadMessageContent,
      userIdLastMessage:conv.userIdLastMessage
    };

    openChat(friendData);
  };

  // 🔥 Loading skeleton - Chỉ hiển thị lần đầu
  if (initialLoading) {
    return (
      <div className="conversation-list">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="conversation-item skeleton">
            <div className="conversation-avatar-wrapper">
              <div className="skeleton-avatar"></div>
            </div>
            <div className="conversation-info">
              <div className="skeleton-name"></div>
              <div className="skeleton-message"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 🔥 Empty state
  if (!conversations || !conversations.length) {
    return (
      <div className="conversation-empty">
        <div className="empty-illustration">
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="45" fill="#E8F4FD" />
            <path
              d="M30 40C30 35.5817 33.5817 32 38 32H62C66.4183 32 70 35.5817 70 40V55C70 59.4183 66.4183 63 62 63H45L35 70V63H38C33.5817 63 30 59.4183 30 55V40Z"
              fill="#0068FF"
            />
            <circle cx="42" cy="47" r="3" fill="white" />
            <circle cx="50" cy="47" r="3" fill="white" />
            <circle cx="58" cy="47" r="3" fill="white" />
          </svg>
        </div>
        <h3>Chưa có cuộc trò chuyện</h3>
        <p>Bắt đầu trò chuyện với bạn bè ngay!</p>
      </div>
    );
  }

  return (
    <div className="conversation-list">
      {conversations.map((conv) => {
        const isActive = activeChat?.conversationId === conv.conversationId;

        return (
          <div
            key={conv.conversationId}
            className={`conversation-item ${isActive ? "active" : ""}`}
            onClick={() => handleClick(conv)}
          >
            {/* Avatar */}
            <div className="conversation-avatar-wrapper">
              <img
                src={
                  conv.friendAvatar ||
                  "https://cdn-icons-png.flaticon.com/512/847/847969.png"
                }
                alt={conv.friendName}
                className="conversation-avatar"
                loading="lazy"
              />
              {conv.online && <span className="online-indicator"></span>}
            </div>

            {/* Info */}
            <div className="conversation-info">
              <div className="conversation-row">
                <h4 className="conversation-name">
                  {conv.friendName}
                </h4>
              </div>
              <div className="conversation-row">
                <p className="last-message">
                  {conv.userIdLastMessage === currentUser?.id && (
                    <span className="me-prefix">Bạn: </span>
                  )}
                  {truncateMessage(conv.lastReadMessageContent)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
