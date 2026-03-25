import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BiSearch,
  BiMessageRounded,
  BiPlus,
  BiUserPlus,
  BiCheck,
  BiX,
} from "react-icons/bi";
import { MdOutlineArticle } from "react-icons/md";
import { useUser } from "../../hooks/useUser";

import {
  acceptFriend,
  unRequestFriend,
  rejectFriendRequest
} from "../../api/service/friend";
import { useSocial } from "../../context/socialContext";

import { sendSocketData } from "../../api/websocket";

import "./ChatArea.css";
import FriendList from "../../component/FriendList/FriendList";
import ConversationList from "../../component/ConversationList/ConversationList";
import { useChat } from "../../context/chatContext";

function ChatArea({ activeTab }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // 🔥 Dữ liệu realtime lấy từ UserContext
  const { currentUser } = useUser();
  const { friendRequests, removeFriendRequest } = useSocial();
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
      const res = await acceptFriend(currentUser.id, senderId);

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
      await rejectFriendRequest(currentUser.id, senderId);
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
          <div className="chat-area-container">
            <div className="chat-list-header">
              <div className="header-title">
                <h2>Tin nhắn</h2>
                <button className="new-chat-btn">
                  <BiPlus />
                </button>
              </div>

              <div className="chat-search">
                <BiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Tìm kiếm tin nhắn"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="chat-filters">
                <button className="filter-tab active">Tất cả</button>
                <button className="filter-tab">Chưa đọc</button>
              </div>
            </div>

            <div className="chat-list-content">
              <ConversationList />
            </div>
          </div>
        );

      case "contacts":
        return (
          <div className="chat-area-container">
            <div className="chat-list-header">
              <div className="header-title">
                <h2>Danh bạ</h2>
              </div>

              <div className="chat-search">
                <BiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Tìm kiếm bạn bè"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            <FriendList />
          </div>
        );

      case "friendRequests":
        return (
          <div className="chat-area-container">
            <div className="chat-list-header">
              <div className="header-title">
                <h2>Lời mời kết bạn</h2>
              </div>
            </div>

            <div className="chat-list-content">
              <FriendRequestSection
                friendRequests={friendRequests}
                handleAccept={handleAccept}
                handleDecline={handleDecline}
                formatRequestTime={formatRequestTime}
                onAvatarClick={(userId) => navigate(`/user/${userId}`)}
              />
            </div>
          </div>
        );

      case "timeline":
        return (
          <div className="chat-area-container">
            <div className="chat-list-header">
              <div className="header-title">
                <h2>Nhật ký</h2>
                <button className="new-chat-btn">
                  <BiPlus />
                </button>
              </div>
            </div>

            <div className="chat-list-content">
              <div className="empty-chat-state">
                <MdOutlineArticle className="empty-icon" />
                <h3>Chưa có nhật ký</h3>
                <p>Chia sẻ khoảnh khắc của bạn</p>
                <button className="start-chat-btn">
                  <BiPlus />
                  Tạo bài viết
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="chat-area-container">
            <div className="chat-list-header">
              <div className="header-title">
                <h2>Zalo</h2>
              </div>
            </div>

            <div className="chat-list-content">
              <div className="empty-chat-state">
                <BiMessageRounded className="empty-icon" />
                <h3>Chào mừng đến với Zalo</h3>
                <p>Chọn một mục từ thanh bên để bắt đầu</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return <div className="chat-area">{renderContent()}</div>;
}

// -------------------------------------------------------------------
// --------------------- COMPONENT LỜI MỜI KẾT BẠN --------------------
// -------------------------------------------------------------------
const FriendRequestSection = ({
  friendRequests,
  handleAccept,
  handleDecline,
  formatRequestTime,
  onAvatarClick,
}) => (
  <div className="friend-requests-panel">
    <div className="fr-panel-header">
      <div>
        <p className="fr-panel-label">Lời mời kết bạn</p>
        <h3>Kết nối ngay với bạn mới</h3>
      </div>
      <span className="fr-panel-count">{friendRequests?.length || 0}</span>
    </div>

    {friendRequests?.length > 0 ? (
      <div className="friend-requests-grid">
        {friendRequests.map((req) => {
          const displayName = req.senderName || req.phone || "Người dùng";
          const displayId = req.senderId || req.phone || req.id;
          const userId = req.senderId || req.id;

          return (
            <div key={req.id || displayId} className="friend-request-card">
              <div className="fr-card-meta">
                <div 
                  className="fr-card-avatar clickable"
                  onClick={() => userId && onAvatarClick && onAvatarClick(userId)}
                  style={{ cursor: userId ? "pointer" : "default" }}
                  title="Xem trang cá nhân"
                >
                  {req.senderAvatarUrl ? (
                    <img src={req.senderAvatarUrl} alt={displayName} />
                  ) : (
                    <span>{displayName.charAt(0)}</span>
                  )}
                </div>

                <div className="fr-card-info">
                  <div className="fr-card-name">{displayName}</div>
                  <div className="fr-card-note">
                    <BiUserPlus />
                    <span>{req.phone || "Lời mời mới"}</span>
                  </div>
                </div>

                <span className="fr-card-time">
                  {formatRequestTime(req.createdAt)}
                </span>
              </div>

              <div className="fr-card-actions">
                <button
                  className="fr-btn fr-btn-ghost"
                  onClick={() => handleDecline(req)}
                >
                  <BiX />
                  Từ chối
                </button>

                <button
                  className="fr-btn fr-btn-primary"
                  onClick={() => handleAccept(req)}
                >
                  <BiCheck />
                  Chấp nhận
                </button>
              </div>
            </div>
          );
        })}
      </div>
    ) : (
      <div className="empty-requests modern">
        <BiUserPlus />
        <div>
          <h4>Chưa có lời mời mới</h4>
          <p>Khi có người gửi lời mời, bạn sẽ thấy ở đây ngay.</p>
        </div>
      </div>
    )}
  </div>
);

export default ChatArea;
