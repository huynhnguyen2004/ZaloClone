// ChatWindow.jsx
import { useChat } from "../../context/ChatContext";
import "./ChatWindow.css";
import { BiArrowBack } from "react-icons/bi";
import { FiPhone, FiVideo } from "react-icons/fi";
import { useEffect, useRef, useState } from "react";
import { useUser } from "../../context/UserContext";
import { sendMessage,readMessage } from "../../api/service/chat";
import { sendSocketData } from "../../api/websocket";
import { getAvatarUrl } from "../../utils/avatarHelper";

export default function ChatWindow({ onCloseChat }) {
  const { activeChat, messages, setMessages } = useChat();
  const { currentUser } = useUser();
  const [text, setText] = useState("");
  const endRef = useRef();
  const pendingMessageIds = useRef(new Set()); // 🔥 Track pending messages

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    if (!text.trim()) return;

    const msgBody = {
      senderId: currentUser.id,
      receiverId: activeChat.friendId,
      conversationId: activeChat.conversationId, // 🔥 Thêm conversationId
      content: text,
    };

    setText("");

    try {
      // 🔥 Lưu DB và lấy real ID
      const saved = await sendMessage(msgBody);
      console.log("✅ Message saved:", saved);

      // 🔥 Mark ID này là "pending" - đừng thêm từ WebSocket
      pendingMessageIds.current.add(saved.id);

      // 🔥 Thêm vào UI ngay
      setMessages((prev) => {
        // Double-check không duplicate
        if (prev.some((m) => m.id === saved.id)) {
          console.log("⚠️ Message already exists:", saved.id);
          return prev;
        }
        return [...prev, saved];
      });

      // 🔔 Gửi realtime để notify receiver
      sendSocketData("/app/chat", msgBody);

   

      // 🔥 Sau 1 giây, remove khỏi pending (phòng trường hợp WebSocket chậm)
      setTimeout(() => {
        pendingMessageIds.current.delete(saved.id);
      }, 1000);
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
          className="chat-avatar"
          alt={activeChat.friendName}
        />

        <div className="chat-info">
          <h3 className="chat-title">{activeChat?.friendName} {activeChat?.friendlastName}</h3>
          <span className={`chat-status ${activeChat?.online ? "online" : ""}`}>
            {activeChat?.online ? "Đang hoạt động" : "Ngoại tuyến"}
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
      <div className="chat-body">
        {messages.map((msg, index) => {
          const senderId = msg.senderId || msg.sender?.id;
          const isMe = senderId === currentUser.id;
          
          // Tìm tin nhắn cuối cùng của mình đã được xem
          const myMessages = messages.filter(m => (m.senderId || m.sender?.id) === currentUser.id);
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