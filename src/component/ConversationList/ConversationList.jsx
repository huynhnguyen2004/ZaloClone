import React, { useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "./ConversationList.css";
import { useChat } from "../../context/ChatContext";
import { getAvatarUrl } from "../../utils/avatarHelper";
import { UserContext } from "../../context/userContext";
import { useConversation } from "../../context/conversationContext";

export default function ConversationList() {
  const navigate = useNavigate();
  const { currentUser, isUserOnline } = useContext(UserContext);
  const { openChat, activeChat } = useChat();
  const {
    conversations,
    initialLoading,
    loadMoreConversations,
    hasMoreConversations,
    isLoadingMoreConversations,
  } = useConversation();

  const isPrivateConversation = (type) => String(type || "").toUpperCase() === "PRIVATE";

  const handleScroll = useCallback(
    (e) => {
      const { scrollTop, scrollHeight, clientHeight } = e.target;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50;

      if (isNearBottom && hasMoreConversations && !isLoadingMoreConversations) {
        loadMoreConversations();
      }
    },
    [hasMoreConversations, isLoadingMoreConversations, loadMoreConversations],
  );

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
    if (diffMins < 60) return `${diffMins} phút trước`;

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

  // 🔥 Format thời gian hoạt động cuối (lastOnline) - ngắn gọn cho badge
  const formatLastOnline = (lastOnlineDate) => {
    if (!lastOnlineDate) return "";

    const date = new Date(lastOnlineDate);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Vừa mới online (dưới 1 phút)
    if (diffMins < 1) return "1ph";

    // Trong vòng 1 giờ - hiển thị số phút
    if (diffMins < 60) return `${diffMins}ph`;

    // Trong vòng 24 giờ - hiển thị số giờ
    if (diffHours < 24) return `${diffHours}g`;

    // Trong tuần - hiển thị số ngày
    if (diffDays < 7) return `${diffDays}ng`;

    // Lâu hơn - hiển thị tuần
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}t`;

    // Quá lâu - không hiển thị
    return "";
  };

  // 🔥 Click vào conversation
  const handleClick = (conv) => {
    const friendData = {
      conversationId: conv.conversationId,
      friendId: conv.friendId,
     
      displayName: conv.displayName  || "Unknown",
      avatarUrl: conv.avatar || conv.friendAvatar,
      online: Boolean(conv.online),
      lastOnline: conv.lastOnline,
      lastReadMessageContent: conv.lastMessage || conv.lastReadMessageContent,
  
      type: conv.type,
    };

    openChat(friendData);
  };

  // 🔥 Click vào avatar để xem profile
  const handleAvatarClick = (e, userId, type) => {
    e.stopPropagation(); // Ngăn không cho click vào conversation
    if (!isPrivateConversation(type) || !userId) return;
    navigate(`/user/${userId}`);
  };

  // 🔥 Loading skeleton - Chỉ hiển thị lần đầu
  if (initialLoading) {
    return (
      <div className="conversation-list" onScroll={handleScroll}>
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
    <div className="conversation-list" onScroll={handleScroll}>
      {conversations.map((conv) => {
        const isActive = activeChat?.conversationId === conv.conversationId;
        const isCurrentUserSender =
          Number(conv.lastSenderId ?? conv.userIdLastMessage) ===
          Number(currentUser?.id);
        // Kiểm tra tin nhắn chưa đọc (không phải do mình gửi)
        const isUnread = (conv.isRead ?? conv.isReadLastContent) === false && !isCurrentUserSender;
        const displayName = conv.displayName || conv.friendName || "Unknown";
        const avatar = conv.avatar || conv.friendAvatar;
        const messageTime = conv.lastMessageTime || conv.createdAt;
        const lastMessage = conv.lastMessage || conv.lastReadMessageContent;
        const canViewProfile = isPrivateConversation(conv?.type) && Boolean(conv?.friendId);
        const canCheckRealtimeOnline = Boolean(conv.friendId);
        const isOnline = canCheckRealtimeOnline
          ? isUserOnline(conv.friendId)
          : Boolean(conv.online);

        return (
          <div
            key={conv.conversationId}
            className={`conversation-item ${isActive ? "active" : ""} ${isUnread ? "has-unread" : ""}`}
            onClick={() => handleClick(conv)}
          >
            {/* Avatar */}
            <div className="conversation-avatar-wrapper">
              <img
                src={getAvatarUrl(avatar)}
                alt={displayName}
                className={`conversation-avatar ${canViewProfile ? "clickable-avatar" : ""}`}
                loading="lazy"
                onClick={(e) => handleAvatarClick(e, conv.friendId, conv.type)}
                title={canViewProfile ? "Xem thông tin" : "Nhóm chat không có trang cá nhân"}
              />
              {/* Online: chấm xanh | Offline: badge thời gian */}
              {isOnline ? (
                <span className="online-indicator"></span>
              ) : (
                conv.lastOnline && formatLastOnline(conv.lastOnline) && (
                  <span className="last-online-badge">
                    {formatLastOnline(conv.lastOnline)}
                  </span>
                )
              )}
            </div>

            {/* Info */}
            <div className="conversation-info">
              <div className="conversation-row">
                <h4 className={`conversation-name ${isUnread ? "unread" : ""}`}>
                  {displayName}
                </h4>
                <span className={`conversation-time ${isUnread ? "unread" : ""}`}>
                  {formatTime(messageTime)}
                </span>
              </div>
              <div className="conversation-row">
                <p className={`last-message ${isUnread ? "unread" : ""}`}>
                  {isCurrentUserSender && (
                    <span className="me-prefix">Bạn: </span>
                  )}
                  {truncateMessage(lastMessage)}
                </p>
                {/* Chấm tròn xanh khi có tin chưa đọc */}
                {isUnread && <span className="unread-dot"></span>}
              </div>
            </div>
          </div>
        );
      })}
      {isLoadingMoreConversations && (
        <div className="conversation-load-more">Đang tải thêm...</div>
      )}
    </div>
  );
}
