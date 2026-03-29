import React from "react";
import { BiMessageRounded } from "react-icons/bi";

function DefaultTabContent() {
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

export default DefaultTabContent;
