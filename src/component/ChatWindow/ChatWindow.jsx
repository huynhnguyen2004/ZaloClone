// ChatWindow.jsx
import { useNavigate } from "react-router-dom";
import { useChat } from "../../context/ChatContext";
import "./ChatWindow.css";
import { BiArrowBack } from "react-icons/bi";
import { FiPhone, FiVideo } from "react-icons/fi";
import { useContext, useLayoutEffect, useRef, useState } from "react";
import { sendMessage } from "../../api/service/chat";
import { getAvatarUrl } from "../../utils/avatarHelper";
import { UserContext } from "../../context/userContext";

export default function ChatWindow({ onCloseChat }) {
  const navigate = useNavigate();
  const {
    activeChat,
    messages,
    appendMessage,
    loadOlderMessages,
    isLoadingOlderMessages,
    hasMoreOlderMessages,
  } = useChat();
  const { currentUser,isUserOnline } = useContext(UserContext);
  
  const [text, setText] = useState("");
  const endRef = useRef();
  const bodyRef = useRef();
  const preserveScrollRef = useRef(false);
  const previousScrollTopRef = useRef(0);
  const previousScrollHeightRef = useRef(0);

  const messageList = messages?.messages ?? [];

  // 🔥 Kiểm tra trạng thái online realtime
  const isFriendOnline = isUserOnline(activeChat?.friendId) || activeChat?.online;

  // 🔥 Format thời gian hoạt động cuối - giống Messenger
  const formatLastOnline = (lastOnlineDate) => {
    if (!lastOnlineDate) return "Ngoại tuyến";

    const date = new Date(lastOnlineDate);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Vừa mới online (dưới 1 phút)
    if (diffMins < 1) return "Vừa truy cập";

    // Trong vòng 1 giờ
    if (diffMins < 60) return `Hoạt động ${diffMins} phút trước`;

    // Trong vòng 24 giờ
    if (diffHours < 24) return `Hoạt động ${diffHours} giờ trước`;

    // Hôm qua
    if (diffDays === 1) return "Hoạt động hôm qua";

    // Trong tuần (2-7 ngày)
    if (diffDays < 7) return `Hoạt động ${diffDays} ngày trước`;

    // Lâu hơn
    return "Ngoại tuyến";
  };

  useLayoutEffect(() => {
    const body = bodyRef.current;

    if (!body) return;

    // Khi prepend lịch sử cũ, giữ nguyên vị trí người dùng đang đọc.
    if (preserveScrollRef.current) {
      const heightDelta = body.scrollHeight - previousScrollHeightRef.current;
      body.scrollTop = previousScrollTopRef.current + heightDelta;
      preserveScrollRef.current = false;
      return;
    }

    // Mặc định luôn kéo xuống tin nhắn mới nhất.
    body.scrollTop = body.scrollHeight;
  }, [messageList.length]);

  const handleScroll = async () => {
    const body = bodyRef.current;

    if (
      !body ||
      body.scrollTop > 80 ||
      !hasMoreOlderMessages ||
      isLoadingOlderMessages
    ) {
      return;
    }

    previousScrollTopRef.current = body.scrollTop;
    previousScrollHeightRef.current = body.scrollHeight;
    preserveScrollRef.current = true;

    const older = await loadOlderMessages();
    if (!older.length) {
      preserveScrollRef.current = false;
    }
  };

  if (!activeChat)
    return <div className="empty-chat">Chọn 1 người để nhắn</div>;

  const formatTime = (t) => {
    const d = new Date(t);
    return d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 🚀 Gửi tin nhắn
  const handleSend = async () => {
    const content = text.trim();
    if (!content) return;

    const msgBody = {
      senderId: currentUser.id,
      receiverId: activeChat.friendId,
      conversationId: activeChat.conversationId,
      content,
    };

    setText("");

    try {
      const saved = await sendMessage(msgBody);
      appendMessage(saved);
    } catch (err) {
      console.error("❌ Send message failed:", err);
    }
  };

  
  return (
    <div className="chat-window">
      {/* HEADER */}
      <div className="chat-header">
        <button className="back-btn" onClick={onCloseChat}>
          <BiArrowBack size={22} />
        </button>

        <img
          src={getAvatarUrl(activeChat.avatarUrl)}
          className="chat-avatar clickable"
          alt={activeChat.friendName}
          onClick={() => navigate(`/user/${activeChat.friendId}`)}
          title="Xem trang cá nhân"
        />

        <div className="chat-info">
          <h3 className="chat-title">{activeChat?.friendName} {activeChat?.friendlastName}</h3>
          <span className={`chat-status ${isFriendOnline ? "online" : "offline"}`}>
            {isFriendOnline ? (
              <>
                <span className="status-dot online"></span>
                Đang hoạt động
              </>
            ) : (
              <>
                <span className="status-dot offline"></span>
                {formatLastOnline(activeChat?.lastOnline)}
              </>
            )}
          </span>
        </div>

        <div className="chat-actions">
          <button className="chat-action-btn">
            <FiPhone size={20} />
          </button>
          <button className="chat-action-btn">
            <FiVideo size={20} />
          </button>
        </div>
      </div>


      {/* BODY */}
      <div className="chat-body" ref={bodyRef} onScroll={handleScroll}>
        {isLoadingOlderMessages && (
          <div className="chat-history-loading">Đang tải tin nhắn cũ...</div>
        )}

        {messageList.map((msg) => {
          const senderId = msg.senderId ;
          const isMe = senderId === currentUser.id;
          
          // Tìm tin nhắn cuối cùng của mình đã được xem
          const myMessages = messageList.filter(m => (m.senderId ) === currentUser.id);
          const lastReadMessage = [...myMessages].reverse().find(m => m.read === true);
          const isLastReadMessage = isMe && msg.read === true && msg.id === lastReadMessage?.id;
          
          return (
            <div
              key={msg.id}
              className={`bubble ${isMe ? "right" : "left"}`}
            >
              <p className="text">{msg.content}</p>
              <div className="bubble-footer">
                <span className="time">{formatTime(msg.createdAt)}</span>
                {isLastReadMessage && (
                  <span className="seen-status">Đã xem</span>
                )}
              </div>
            </div>
          );
        })}

        <div ref={endRef}></div>
      </div>

      {/* INPUT */}
      <div className="chat-input">
        <input
          type="text"
          placeholder="Nhập tin nhắn..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button className="send-btn" onClick={handleSend}>
          Gửi
        </button>
      </div>
    </div>
  );
}