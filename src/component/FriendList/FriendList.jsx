import React from "react";
import "./FriendList.css";

import { useUser } from "../../context/UserContext";
import { useChat } from "../../context/ChatContext";

export default function FriendList() {
  const { friends } = useUser();
  const {openChat}=useChat();

  if (!friends || !friends.length)
    return (
      <div className="empty-chat-state">
        <h3>Danh bạ trống</h3>
        <p>Kết bạn để bắt đầu trò chuyện</p>
      </div>
    );

  return (
    <div className="friend-list">
      {friends.map((f) => (
       <div key={f.friendId} className="friend-card" onClick={()=>openChat(f)}>
  <div className="friend-avatar-wrapper">
    <img
      src={f.avatarUrl || "https://cdn-icons-png.flaticon.com/512/847/847969.png"}
      className="friend-avatar"
      alt={f.friendName}
    />
    {f.online && <span className="online-dot"></span>}
  </div>

  <div className="friend-info">
    <h4>{f.friendName}</h4>
    <p>{f.phone}</p>
  </div>
</div>

      ))}
    </div>
  );
}
