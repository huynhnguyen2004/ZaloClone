import React, { useState } from "react";
import { BiUserMinus } from "react-icons/bi";
import "./FriendList.css";

import { useUser } from "../../context/UserContext";
import { useChat } from "../../context/ChatContext";
import { unFriend } from "../../api/service/friend";
import { getAvatarUrl } from "../../utils/avatarHelper";

export default function FriendList() {
  const { friends, currentUser, setFriends, isUserOnline } = useUser();
  const { openChat } = useChat();
  const [removingIds, setRemovingIds] = useState([]);

  const handleUnfriend = async (e, friend) => {
    e.stopPropagation(); // Ngăn không cho click vào card
    
    if (!currentUser?.id || removingIds.includes(friend.friendId)) return;

    setRemovingIds((prev) => [...prev, friend.friendId]);

    try {
      await unFriend({ user1Id: currentUser.id, user2Id: friend.friendId });
      // Xóa bạn khỏi danh sách
      setFriends((prev) => prev.filter((f) => f.friendId !== friend.friendId));
    } catch (err) {
      console.error("Unfriend error:", err);
    } finally {
      setRemovingIds((prev) => prev.filter((id) => id !== friend.friendId));
    }
  };

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
      src={getAvatarUrl(f.avatarUrl)}
      className="friend-avatar"
      alt={f.friendName}
    />
    {/* Kiểm tra online realtime */}
    {(isUserOnline(f.friendId) || f.online) && <span className="online-dot"></span>}
  </div>

  <div className="friend-info">
    <h4>{f.friendName}</h4>
    <p>{f.phone}</p>
  </div>

  <button
    className="unfriend-btn"
    onClick={(e) => handleUnfriend(e, f)}
    disabled={removingIds.includes(f.friendId)}
    title="Hủy kết bạn"
  >
    <BiUserMinus />
  </button>
</div>

      ))}
    </div>
  );
}
