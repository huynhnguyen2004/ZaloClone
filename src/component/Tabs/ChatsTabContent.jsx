import React from "react";
import { BiSearch, BiPlus } from "react-icons/bi";
import ConversationList from "../ConversationList/ConversationList";

function ChatsTabContent({ searchTerm, onSearchChange }) {
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
  );
}

export default ChatsTabContent;
