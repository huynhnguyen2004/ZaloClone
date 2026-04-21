import React from "react";
import { BiSearch, BiPlus } from "react-icons/bi";
import ConversationList from "../ConversationList/ConversationList";
import ChatWindow from "../ChatWindow/chatWindow";
import { useChat } from "../../context/ChatContext";

function ChatsTabContent({ searchTerm, onSearchChange }) {
  const { activeChat, setActiveChat } = useChat();

  return (
    <div className="chat-split-layout">
      <div className="chat-list-panel">
        <div className="chat-list-header">
          <div className="header-title">
            <h2>Tin nhắn</h2>
            <button className="new-chat-btn" type="button" aria-label="Tạo cuộc trò chuyện mới">
              <BiPlus />
            </button>
          </div>

          <div className="chat-search">
            <BiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm tin nhắn"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
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

      <div className={`chat-pane-panel ${activeChat ? "active" : ""}`}>
        {activeChat ? (
          <ChatWindow onCloseChat={() => setActiveChat(null)} />
        ) : (
          <div className="chat-pane-empty">
            <h3>Chọn một cuộc trò chuyện</h3>
            <p>Bắt đầu nhắn tin với bạn bè ngay trên Zalo Clone.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatsTabContent;
