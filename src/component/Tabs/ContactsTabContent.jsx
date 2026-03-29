import React from "react";
import { BiSearch } from "react-icons/bi";
import FriendList from "../FriendList/FriendList";

function ContactsTabContent({ searchTerm, onSearchChange }) {
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
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <FriendList />
    </div>
  );
}

export default ContactsTabContent;
