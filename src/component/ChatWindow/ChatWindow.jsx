// ChatWindow.jsx
import { useNavigate } from "react-router-dom";
import { useChat } from "../../context/ChatContext";
import "./ChatWindow.css";
import { BiArrowBack } from "react-icons/bi";
import { FiPaperclip, FiPhone, FiSend, FiSmile, FiVideo } from "react-icons/fi";
import { FaHeart, FaLaughBeam, FaSurprise, FaSadTear, FaAngry } from "react-icons/fa";
import { FaThumbsUp } from "react-icons/fa6";
import { useContext, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
    reactToMessage,
  } = useChat();
  const { currentUser, isUserOnline } = useContext(UserContext);
  
  const [text, setText] = useState("");
  const [openReactionMenuId, setOpenReactionMenuId] = useState(null);
  const [openReactionDetailId, setOpenReactionDetailId] = useState(null);
  const bodyRef = useRef();
  const preserveScrollRef = useRef(false);
  const previousScrollTopRef = useRef(0);
  const previousScrollHeightRef = useRef(0);

  const reactionOptions = [
    { id: 1, type: "LIKE", icon: FaThumbsUp, color: "#1877f2", title: "Thích" },
    { id: 2, type: "LOVE", icon: FaHeart, color: "#ff3040", title: "Yêu thích" },
    { id: 3, type: "HAHA", icon: FaLaughBeam, color: "#f7b125", title: "Haha" },
    { id: 4, type: "WOW", icon: FaSurprise, color: "#f7b125", title: "Wow" },
    { id: 5, type: "SAD", icon: FaSadTear, color: "#9aa4b2", title: "Buồn" },
    { id: 6, type: "ANGRY", icon: FaAngry, color: "#f5533d", title: "Giận" },
  ];

  const messageList = messages?.messages ?? [];

  const lastReadMessageId = useMemo(() => {
    const myMessages = messageList.filter(
      (message) => Number(message?.senderId) === Number(currentUser?.id),
    );
    const lastReadMessage = [...myMessages].reverse().find((message) => message.read === true);

    return lastReadMessage?.id;
  }, [messageList, currentUser?.id]);

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

  if (!activeChat) return <div className="empty-chat">Chọn 1 người để nhắn</div>;

  const formatTime = (t) => {
    const d = new Date(t);
    return d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getReactionSummary = (reacts = []) => {
    if (!Array.isArray(reacts) || !reacts.length) return [];

    const summary = new Map();
    reacts.forEach((react) => {
      if (!react?.type) return;
      const current = summary.get(react.type) || 0;
      summary.set(react.type, current + 1);
    });

    return [...summary.entries()].map(([type, count]) => ({ type, count }));
  };

  const getReactionOption = (type) => {
    const normalizedType = String(type || "").toUpperCase();
    return reactionOptions.find(
      (option) => option.type === normalizedType || String(option.id) === String(type),
    );
  };

  const getReactionLabel = (type) => {
    const option = getReactionOption(type);
    return option?.title || String(type || "");
  };

  const sortReactionDetails = (reacts = []) => {
    const currentUserId = Number(currentUser?.id);

    return [...reacts].sort((left, right) => {
      const leftIsMe = Number(left?.userId) === currentUserId;
      const rightIsMe = Number(right?.userId) === currentUserId;

      if (leftIsMe !== rightIsMe) return leftIsMe ? -1 : 1;

      const leftName = `${left?.userFirstName || ""} ${left?.userLastName || ""}`.trim();
      const rightName = `${right?.userFirstName || ""} ${right?.userLastName || ""}`.trim();

      return leftName.localeCompare(rightName, "vi-VN");
    });
  };

  const getReactionDetails = (reacts = []) => {
    if (!Array.isArray(reacts) || !reacts.length) return [];

    return sortReactionDetails(reacts).map((react) => {
      const option = getReactionOption(react.type);
      const Icon = option?.icon;
      const fullName = `${react?.userFirstName || ""} ${react?.userLastName || ""}`.trim() ;
      
      return {
        ...react,
        fullName,
        icon: Icon,
        iconColor: option?.color,
        iconTitle: option?.title || react.type,
      };
    });
  };

  const openReactionDetail = (messageId) => {
    setOpenReactionMenuId(null);
    setOpenReactionDetailId((current) => (current === messageId ? null : messageId));
  };

  const handleReactMessage = async (messageId, reactTypeId) => {
    await reactToMessage({ messageId, reactTypeId });
    setOpenReactionMenuId(null);
    setOpenReactionDetailId(null);
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
        <button className="back-btn" type="button" onClick={onCloseChat}>
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
          <button type="button" className="chat-action-btn" aria-label="Gọi thoại">
            <FiPhone size={20} />
          </button>
          <button type="button" className="chat-action-btn" aria-label="Gọi video">
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
          const senderId = Number(msg?.senderId);
          const isMe = senderId === Number(currentUser?.id);
          const isLastReadMessage = isMe && msg.read === true && msg.id === lastReadMessageId;
          const reactionSummary = getReactionSummary(msg.reacts);
          
          return (
            <div
              key={msg.id}
              className={`message-row ${isMe ? "right" : "left"}`}
              onMouseLeave={() => setOpenReactionMenuId(null)}
            >
              {!isMe && (
                <img
                  src={getAvatarUrl(activeChat.avatarUrl)}
                  alt={activeChat.friendName}
                  className="bubble-avatar"
                />
              )}

              <div className={`bubble ${isMe ? "right" : "left"}`}>
                <button
                  type="button"
                  className="message-react-btn"
                  aria-label="Thêm biểu cảm"
                  title="Biểu cảm"
                  onClick={() =>
                    setOpenReactionMenuId((current) =>
                      current === msg.id ? null : msg.id,
                    )
                  }
                >
                  <FiSmile size={14} />
                </button>

                <p className="text">{msg.content}</p>
                <div className="bubble-footer">
                  <span className="time">{formatTime(msg.createdAt)}</span>
                  {isLastReadMessage && (
                    <span className="seen-status">Đã xem</span>
                  )}
                </div>

                {reactionSummary.length > 0 && (
                  <button
                    type="button"
                    className="reaction-summary"
                    onClick={() => openReactionDetail(msg.id)}
                    aria-label="Xem chi tiết cảm xúc"
                    title="Xem chi tiết cảm xúc"
                  >
                    {reactionSummary.map((item) => (
                      (() => {
                        const option = getReactionOption(item.type);
                        const Icon = option?.icon;

                        return (
                          <span key={item.type} className="reaction-chip" title={option?.title || item.type}>
                            {Icon ? <Icon size={12} color={option?.color} /> : <span className="reaction-fallback">?</span>}
                            <span>{item.count}</span>
                          </span>
                        );
                      })()
                    ))}
                  </button>
                )}

                <AnimatePresence>
                  {openReactionDetailId === msg.id && (
                    <motion.div
                      className="reaction-detail-popup"
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.98 }}
                      transition={{ duration: 0.16, ease: "easeOut" }}
                    >
                      <div className="reaction-detail-header">
                        <div>
                          <h4>Cảm xúc</h4>
                          <p>{getReactionDetails(msg.reacts).length} người đã bày tỏ cảm xúc</p>
                        </div>
                        <button
                          type="button"
                          className="reaction-detail-close"
                          onClick={() => setOpenReactionDetailId(null)}
                          aria-label="Đóng chi tiết cảm xúc"
                        >
                          ×
                        </button>
                      </div>

                      <div className="reaction-detail-list">
                        {getReactionDetails(msg.reacts).map((react, index) => {
                          const Icon = react.icon;
                          const isCurrentUserReact =
                            react?.userId != null &&
                            Number(react.userId) === Number(currentUser?.id);

                          return (
                            <div
                              key={`${react.messageId}-${react.userId ?? react.fullName}-${react.type}-${index}`}
                              className="reaction-detail-item"
                            >
                              <img
                                src={getAvatarUrl(react.avatarUrl)}
                                alt={react.fullName}
                                className="reaction-detail-avatar"
                                loading="lazy"
                              />

                              <div className="reaction-detail-meta">
                                <div className="reaction-detail-name-row">
                                  <span className="reaction-detail-name">{react.fullName}</span>
                                  {isCurrentUserReact && (
                                    <span className="reaction-detail-me">Bạn</span>
                                  )}
                                </div>
                                <span className="reaction-detail-type">{getReactionLabel(react.type)}</span>
                              </div>

                              <span className="reaction-detail-icon" title={react.iconTitle} style={{ color: react.iconColor }}>
                                {Icon ? <Icon size={18} /> : react.type}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {openReactionMenuId === msg.id && (
                    <motion.div
                      className="reaction-menu"
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.16, ease: "easeOut" }}
                    >
                      {reactionOptions.map((option) => {
                        const Icon = option.icon;

                        return (
                          <button
                            key={option.id}
                            type="button"
                            className="reaction-menu-btn"
                            onClick={() => handleReactMessage(msg.id, option.id)}
                            aria-label={option.title}
                            title={option.title}
                            style={{ color: option.color }}
                          >
                            <Icon size={18} />
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      {/* INPUT */}
      <div className="chat-input">
        <button type="button" className="input-icon-btn" aria-label="Đính kèm tệp">
          <FiPaperclip size={18} />
        </button>
        <input
          type="text"
          placeholder="Nhập tin nhắn..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button type="button" className="input-icon-btn" aria-label="Biểu cảm">
          <FiSmile size={18} />
        </button>
        <button type="button" className="send-btn" onClick={handleSend}>
          <FiSend size={18} />
        </button>
      </div>
    </div>
  );
}