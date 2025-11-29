import { useChat } from "../../context/ChatContext";
import "./ChatWindow.css";
import { BiArrowBack } from "react-icons/bi";
import { FiPhone, FiVideo } from "react-icons/fi";

export default function ChatWindow({ onCloseChat }) {
  const { activeChat } = useChat();

  if (!activeChat)
    return <div className="empty-chat">Chọn 1 người để nhắn</div>;


  return (
    <div className="chat-window">

      {/* ===== HEADER ===== */}
      <div className="chat-header">

        {/* Back button (mobile only) */}
        <button className="back-btn" onClick={onCloseChat}>
          <BiArrowBack size={22} />
        </button>

        {/* Avatar */}
        <img
          src={
            activeChat.avatarUrl ||
            "https://cdn-icons-png.flaticon.com/512/847/847969.png"
          }
          className="chat-avatar"
          alt=""
        />

        {/* User info */}
        <div className="chat-info">
          <h3 className="chat-title">{activeChat.friendName}</h3>
          <span className={`chat-status ${activeChat.online ? "online" : ""}`}>
            {activeChat.online ? "Đang hoạt động" : "Ngoại tuyến"}
          </span>
        </div>

        {/* ===== ACTION BUTTONS ===== */}
        <div className="chat-actions">
          <button className="chat-action-btn">
            <FiPhone size={20} />
          </button>

          <button className="chat-action-btn">
            <FiVideo size={20} />
          </button>
        </div>

      </div>

      {/* ===== BODY ===== */}
      <div className="chat-body">
        {/* Tin nhắn */}
      </div>

      {/* ===== INPUT ===== */}
      <div className="chat-input">
        <input type="text" placeholder="Nhập tin nhắn..." />
        <button className="send-btn">Gửi</button>
      </div>

    </div>
  );
}
