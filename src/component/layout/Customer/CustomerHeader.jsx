import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { BiSearch, BiPlus, BiUserPlus, BiUserMinus } from "react-icons/bi";
import { RiMessage3Line } from "react-icons/ri";
import { sendFriendRequest, unFriend } from "../../../api/service/friend";
import { sendSocketData } from "../../../api/websocket";
import { search as searchUsers } from "../../../api/service/userService";
import { getAvatarUrl } from "../../../utils/avatarHelper";
import UserDropdown from "../../UserDropdown/UserDropdown";
import "./CustomerHeader.css";
import { UserContext } from "../../../context/userContext";

function CustomerHeader({ onProfileClick }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const [sendingIds, setSendingIds] = useState([]);
  const [removingIds, setRemovingIds] = useState([]);
  const { currentUser } = useContext(UserContext);
useEffect(() => {
  const q = query.trim();

  // ✅ chặn mount + input rác
  if (!q || q.length < 10) {
    setResults([]);
    setOpen(false);
    return;
  }

  let isActive = true;

  const debounce = setTimeout(async () => {
    try {
      setLoading(true);

      const data = await searchUsers({ key: q });

      if (!isActive) return;

      // ✅ FIX QUAN TRỌNG: đảm bảo luôn là array
      if (Array.isArray(data)) {
        setResults(data);
      } else if (data) {
        setResults([data]);
      } else {
        setResults([]);
      }

      setOpen(true);

    } catch (err) {
      if (!isActive) return;

      setResults([]);
      setOpen(true);
    } finally {
      if (isActive) setLoading(false);
    }
  }, 400);

  return () => {
    isActive = false;
    clearTimeout(debounce);
  };
}, [query]);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".search-container")) {
        setOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);
  const handleAddFriend = async (user) => {
    if (!currentUser?.id) return;

    const receiverId = user.id;

    if (sendingIds.includes(receiverId)) return;

    setSendingIds((prev) => [...prev, receiverId]);

    try {
      const res = await sendFriendRequest(currentUser.id, receiverId);
      const payload = res?.data || {
        senderId: currentUser.id,
        receiverId,
      };

      try {
        sendSocketData("/app/friend/send", payload);
      } catch (e) {
        console.warn("WS publish failed", e);
      }

      // 🔥 Đóng dropdown sau khi gửi
      setResults((prev) =>
        prev.map((u) => (u.id === receiverId ? { ...u, isFriend: true } : u)),
      );
      setOpen(false);
      setQuery("");
    } catch (err) {
      console.error("Send friend error", err);
    } finally {
      setSendingIds((prev) => prev.filter((i) => i !== receiverId));
    }
  };
  const handleRemoveFriend = async (friendUser) => {
    if (!currentUser?.id) return;

    const friendId = friendUser.id;

    if (removingIds.includes(friendId)) return;

    setRemovingIds((prev) => [...prev, friendId]);

    try {
      await unFriend({ user1Id: currentUser.id, user2Id: friendId });

      // Cập nhật lại kết quả tìm kiếm
      setResults((prev) =>
        prev.map((u) => (u.id === friendId ? { ...u, isFriend: false } : u)),
      );
    } catch (err) {
      console.error("Remove friend error", err);
    } finally {
      setRemovingIds((prev) => prev.filter((i) => i !== friendId));
    }
  };

  // Click vào avatar để xem profile
  const handleAvatarClick = (userId) => {
    setOpen(false);
    setQuery("");
    navigate(`/user/${userId}`);
  };

  return (
    <div className="header-container">
      {/* Logo */}
      <div className="header-left">
        <div className="zalo-logo">
          <RiMessage3Line className="logo-icon" />
          <span className="logo-text">Chat</span>
        </div>
      </div>

      {/* Search */}
      <div className="header-center">
        <div className="search-container">
          <BiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm tin nhắn, liên hệ"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
          />

          {open && (
            <div className="search-dropdown">
              {loading ? (
                <div className="search-loading">Đang tìm kiếm...</div>
              ) : results.length > 0   ? (
                results?.map((user) => (
                  <div key={user.id} className="search-dropdown-item">
                    <div
                      className="search-avatar-wrapper"
                      onClick={() => handleAvatarClick(user.id)}
                    >
                      <img
                        src={getAvatarUrl(user.avatarUrl)}
                        alt={user.firstname}
                        className="search-avatar"
                        
                      />
                    
                    </div>

                    <div className="search-info">
                      <div className="search-name">
                        {user.firstname} {user.lastname}
                      </div>
                      <div className="search-phone">{user.phone}</div>
                      
                    </div>
                    
        
                    <div className="search-action">
                      {user.isFriend ? (
                        <button
                          className="search-remove-btn"
                          onClick={() => handleRemoveFriend(user)}
                          disabled={removingIds.includes(user.id)}
                          title="Hủy bạn bè"
                        >
                          <BiUserMinus />
                        </button>
                      ) : (
                        <button
                          className="search-add-btn"
                          onClick={() => handleAddFriend(user)}
                          disabled={sendingIds.includes(user.id)}
                          title="Thêm bạn bè"
                        >
                          <BiUserPlus />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="search-empty">Không tìm thấy kết quả</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* User */}
      <div className="header-right">
        <button className="action-btn">
          <BiPlus />
        </button>
        <UserDropdown onProfileClick={onProfileClick} />
      </div>
    </div>
  );
}

export default CustomerHeader;
